package main

import (
	"flag"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/pat"
)

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

func main() {
	var (
		clientID = flag.String("client-id", "", "google oauth client id")
		port     = flag.String("port", "3000", "address to bind the server on")
	)
	flag.Parse()

	m := pat.New()

	m.Get("/public/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	m.Get("/", index(*clientID))

	handler := handlers.CompressHandler(handlers.LoggingHandler(os.Stdout, m))
	log.Printf("Listening on %s\n", *port)
	log.Fatal(http.ListenAndServe(":"+*port, handler))
}
