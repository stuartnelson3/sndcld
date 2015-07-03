VERSION := $(shell git rev-parse --short --verify HEAD)
LDFLAGS := -ldflags "-X main.Version $(VERSION)"

SRC=$(wildcard *.go)
TGT=main

OS=$(subst Darwin,darwin,$(subst Linux,linux,$(shell uname)))
ARCH=$(shell uname -m)

GOVER=go1.4.2
GOOS=$(subst Darwin,darwin,$(subst Linux,linux,$(OS)))
GOARCH=$(subst x86_64,amd64,$(ARCH))
GOPKG=$(subst darwin-amd64,darwin-amd64-osx10.8,$(GOVER).$(GOOS)-$(GOARCH).tar.gz)
GOROOT=$(CURDIR)/.deps/go
GOPATH=$(CURDIR)/.deps/gopath
GOCC=$(GOROOT)/bin/go
GO=GOROOT=$(GOROOT) GOPATH=$(GOPATH) $(GOCC)

NODE_VER=v0.10.38
NODE_DIR=node-$(NODE_VER)-$(GOOS)-x64
NODE_URL=http://files.int.s-cloud.net/nodejs/$(NODE_DIR).tar.gz
NPM=.deps/$(NODE_DIR)/bin/npm
BOWER=PATH=.deps/$(NODE_DIR)/bin:$$PATH node_modules/.bin/bower
GRUNT=PATH=.deps/$(NODE_DIR)/bin:$$PATH node_modules/.bin/grunt

build: $(TGT) public/application.css public/application.js

test: $(GOCC) $(SRC)
	$(GO) test

clean:
	rm -rf .deps node_modules public/vendor

format:
	find . -iname '*.go' -exec gofmt -w -s=true '{}' ';'

advice:
	go tool vet .

.deps:
	mkdir -p $@

.deps/$(GOPKG): | .deps
	curl -o .deps/$(GOPKG) https://storage.googleapis.com/golang/$(GOPKG)

$(GOCC): .deps/$(GOPKG)
	tar -C .deps -xzf .deps/$(GOPKG)
	touch $@

dependencies: $(SRC)
	$(GO) get -d

$(TGT): $(GOCC) $(SRC) dependencies
	$(GO) build $(LDFLAGS) -v -o $(TGT)

public/application.css: public/vendor $(shell find public/css -type f)
	$(GRUNT) cssmin

public/application.js: public/vendor $(shell find public/js -type f)
	$(GRUNT) uglify

public/vendor: node_modules bower.json
	$(BOWER) install --allow-root
	@touch $@

node_modules: .deps/$(NODE_DIR) package.json
	$(NPM) install
	@touch $@

.deps/$(NODE_DIR): | .deps
	curl $(NODE_URL) | tar xz -C .deps

.PHONY: advice build clean dependencies format test
