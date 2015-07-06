package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"

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
			http.Error(w, "Returned state token does not match.", 401)
			return
		}

		t, err := config.Exchange(oauth2.NoContext, r.FormValue("code"))
		if err != nil {
			http.Error(w, err.Error(), 500)
		}

		session, _ := store.Get(r, storeName)

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
			http.Error(w, "Nothing stored in session.", 401)
			return
		}

		resp, err := http.Get(fmt.Sprintf("%s?oauth_token=%s", soundcloudURLBase, t.(string)))
		if err != nil {
			http.Error(w, err.Error(), 500)
		}
		defer resp.Body.Close()

		io.Copy(w, resp.Body)
	}
}

func logout(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, storeName)
		session.Values["email"] = ""
		session.Values["token"] = ""
		session.Save(r, w)
	}
}

func index(id string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		f, err := os.Open("./layout.html")
		if err != nil {
			http.Error(w, "Failed to load layout.html.", 500)
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
			http.Error(w, "No token in session", 500)
		}

		resp, err := http.Get(fmt.Sprintf("%s/activities?limit=25&oauth_token=%s", soundcloudURLBase, t.(string)))
		if err != nil {
			http.Error(w, "No token in session", 500)
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
			http.Error(w, "no token in session", 500)
		}

		b := playlist{
			Sharing: "public",
		}
		json.NewDecoder(r.Body).Decode(&b)

		u := fmt.Sprintf("https://api.soundcloud.com/me/playlists?oauth_token=%s\n", t.(string))
		values := map[string]playlist{
			"playlist": b,
		}
		buf := new(bytes.Buffer)
		err := json.NewEncoder(buf).Encode(values)
		if err != nil {
			http.Error(w, "failed to marshal json", 500)
		}

		// bodyType := "application/x-www-form-urlencoded"
		bodyType := "application/json"
		req, err := http.NewRequest("PUT", u, buf)
		req.Header.Set("Content-Type", bodyType)

		// out, err := httputil.DumpRequestOut(req, true)
		// if err != nil {
		// 	http.Error(w, "failed to create playlist", 500)
		// }
		// io.Copy(os.Stdout, bytes.NewReader(out))

		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "failed to create playlist", 500)
		}
		defer resp.Body.Close()

		io.Copy(os.Stdout, resp.Body)
	}
}

func main() {
	var (
		clientID      = flag.String("client-id", "", "soundcloud client id")
		clientSecret  = flag.String("client-secret", "", "soundcloud client secret")
		port          = flag.String("port", "3000", "address to bind the server on")
		callbackToken = flag.String("callback-token", "testToken", "OAuth token used to protect against CSRF attacks")
		appURL        = flag.String("app-url", "http://import-cloud/", "url of the app")
		store         = sessions.NewCookieStore([]byte("secret key"))
	)
	flag.Parse()

	config := &oauth2.Config{
		ClientID:     *clientID,
		ClientSecret: *clientSecret,
		RedirectURL:  path.Join(*appURL, "/oauth2callback"),
		Scopes: []string{
			"non-expiring",
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
	log.Printf("api %s listening on %s\n", Version, *port)
	log.Fatal(http.ListenAndServe(":"+*port, handler))
}
