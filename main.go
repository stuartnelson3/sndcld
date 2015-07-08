package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gorilla/context"
	"github.com/gorilla/handlers"
	"github.com/gorilla/pat"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

var (
	Version = "0.0.1"

	soundcloudURLBase = "https://api.soundcloud.com/me"
)

const (
	storeName = "sndcld"
)

func handleAuthorize(config *oauth2.Config, token string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, config.AuthCodeURL(token, oauth2.AccessTypeOnline), http.StatusFound)
	}
}

func handleOAuth2Callback(store *sessions.CookieStore, config *oauth2.Config, token string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if st := r.FormValue("state"); st != token {
			http.Error(w, "returned state token does not match", http.StatusUnauthorized)
			return
		}

		t, err := config.Exchange(oauth2.NoContext, r.FormValue("code"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}

		session, err := store.Get(r, storeName)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		session.Values["token"] = t.AccessToken
		session.Save(r, w)

		f, _ := os.Open("./layout.html")
		io.Copy(w, f)
		f.Close()
	}
}

func checkAuth(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, storeName)

		t, ok := session.Values["token"]
		if !ok || t == "" {
			http.Error(w, "nothing stored in session", http.StatusUnauthorized)
			return
		}

		resp, err := http.Get(fmt.Sprintf("%s?oauth_token=%s", soundcloudURLBase, t.(string)))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		defer resp.Body.Close()

		io.Copy(w, resp.Body)
	}
}

func logout(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, storeName)
		session.Values["token"] = ""
		session.Save(r, w)
	}
}

func index(id string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f, err := os.Open("./layout.html")
		if err != nil {
			http.Error(w, "failed to load layout.html", http.StatusInternalServerError)
		}
		io.Copy(w, f)
		f.Close()
	}
}

func getStream(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, storeName)

		t, ok := session.Values["token"]
		if !ok {
			http.Error(w, "no token in session", http.StatusUnauthorized)
		}

		resp, err := http.Get(fmt.Sprintf("%s/activities?limit=25&oauth_token=%s", soundcloudURLBase, t.(string)))
		if err != nil {
			http.Error(w, "no token in session", http.StatusUnauthorized)
		}
		defer resp.Body.Close()

		io.Copy(w, resp.Body)
	}
}

type playlist struct {
	Title   string `json:"title"`
	Tracks  []int  `json:"tracks"`
	Sharing string `json:"sharing"`
}

func createSet(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, storeName)

		t, ok := session.Values["token"]
		if !ok {
			http.Error(w, "no token in session", http.StatusUnauthorized)
		}

		b := playlist{
			Sharing: "public",
		}
		json.NewDecoder(r.Body).Decode(&b)

		u, err := url.Parse(soundcloudURLBase)
		if err != nil {
			http.Error(w, "error parsing url", http.StatusInternalServerError)
		}
		u.Path = "/playlists"

		v := u.Query()
		// playlist[title]=title&playlist[tracks][][id]=123&playlist[tracks][][id]=123&playlist[tracks][][id]=123&playlist[sharing]=public
		v.Set("oauth_token", t.(string))
		v.Set("playlist[title]", b.Title)
		v.Set("playlist[sharing]", b.Sharing)

		for _, id := range b.Tracks {
			v.Add("playlist[tracks][][id]", fmt.Sprintf("%d", id))
		}

		u.RawQuery = v.Encode()

		req, _ := http.NewRequest("POST", u.String(), nil) //strings.NewReader(data.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "failed to create playlist", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			http.Error(w, "failed to create playlist", resp.StatusCode)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"result": "success"})
	}
}

func main() {
	var (
		clientID      = flag.String("client-id", "", "soundcloud client id")
		clientSecret  = flag.String("client-secret", "", "soundcloud client secret")
		port          = flag.String("port", "3000", "address to bind the server on")
		callbackToken = flag.String("callback-token", "testToken", "OAuth token used to protect against CSRF attacks")
		appURL        = flag.String("app-url", "http://localhost:3000", "url of the app")
		store         = sessions.NewCookieStore([]byte("secret key"))
	)
	flag.Parse()

	config := &oauth2.Config{
		ClientID:     *clientID,
		ClientSecret: *clientSecret,
		RedirectURL:  *appURL + "/oauth2callback",
		Scopes: []string{
			"non-expiring", // need to get "*" to work
		},
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://soundcloud.com/connect",
			TokenURL: "https://api.soundcloud.com/oauth2/token",
		},
	}
	m := pat.New()

	m.Get("/public/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	m.Post("/create-set", createSet(store))
	m.Get("/check-auth", checkAuth(store))
	m.Get("/stream", getStream(store))
	m.Get("/oauth2callback", handleOAuth2Callback(store, config, *callbackToken))
	m.Post("/authorize", handleAuthorize(config, *callbackToken))
	m.Post("/logout", logout(store))
	m.Get("/", index(*clientID))

	handler := handlers.CompressHandler(handlers.LoggingHandler(os.Stdout, m))
	handler = context.ClearHandler(handler)
	log.Printf("api %s listening on %s\n", Version, *port)
	log.Fatal(http.ListenAndServe(":"+*port, handler))
}
