#!/usr/bin/env node
const fs = require("fs");
const pup = require("puppeteer");
let browserPromise = pup.launch({
    headless: false,
    defaultViewport: false
});
let movieDatabase = [];
let tab;
let count = 0;
browserPromise.then(function (browser) {
    let pagesPromise = browser.pages();
    return pagesPromise;
}).then(function (pages) {
    tab = pages[0];
    let pageOpenPromise = tab.goto("https://www.imdb.com/chart/top/");
    return pageOpenPromise;
}).then(function () {
    tab.waitForSelector(".titleColumn a");
    let movieName = tab.$$(".titleColumn a");
    return movieName;
}).then(function (movies) {
    let moviesLink = [];
    for (let i of movies) {
        let film = tab.evaluate(function (ele) {
            return ele.getAttribute("href");
        }, i);
        moviesLink.push(film);
    }
    return Promise.all(moviesLink);
}).then(function (moviesUrl) {
    let movieDetails = movieInfo("https://www.imdb.com/" + moviesUrl[0]);
    for (let i = 1; i < 50; i++) {
        movieDetails = movieDetails.then(function () {
            return movieInfo("https://www.imdb.com/" + moviesUrl[i]);
        })
    }
})

function movieInfo(url) {
    let obj = {};
    return new Promise(function (resolve, reject) {
        tab.goto(url).then(function () {
            let movieName = tab.waitForSelector("h1", { visible: true }).then(function () {
                let movieNamePromise = tab.$("h1");  // Movie name
                return movieNamePromise;
            })
            return movieName;
        }).then(function (movie) {
            if (movie == null) {
                return "";
            }
            let name = tab.evaluate(function (ele) {
                return ele.textContent;
            }, movie);
            return name;
        }).then(function (name) {
            obj["Name"] = name;
            let movieD = tab.waitForSelector("#titleDetails .txt-block").then(function () {
                let movieDetails = tab.$$("#titleDetails .txt-block");
                return movieDetails;
            })
            return movieD;
        }).then(function (movies) {
            let country = tab.waitForSelector(".txt-block a").then(function () { // country
                let country = movies[1].$("a");
                return country;
            })
            return country;
        }).then(function (movie) {
            if (movie == null) {
                return "";
            }
            let con = tab.evaluate(function (ele) {
                return ele.textContent;
            }, movie);
            return con;
        }
        ).then(function (country) {
            obj["Country"] = country;
        }).then(function (movies) {
            let movieDetails = [];
            let len = tab.waitForSelector(".txt-block time").then(function () {
                let len = tab.$(".txt-block time").then(function (ans) {  // length
                    if (ans == null) {
                        return "";
                    }
                    let length = tab.evaluate(function (ele) {
                        return ele.textContent;
                    }, ans);
                    return length;
                })
                return len;
            })

            movieDetails.push(len);
            let storyLine = tab.waitForSelector("#titleStoryLine p span").then(function () {
                let storyLine = tab.$("#titleStoryLine p span").then(function (ans) { // story
                    if (ans == null) {
                        return "";
                    }
                    let story = tab.evaluate(function (ele) {
                        return ele.textContent;
                    }, ans);
                    return story;
                });
                return storyLine;
            })

            movieDetails.push(storyLine);
            let rating = tab.waitForSelector(".ratingValue strong span").then(function () {
                let rating = tab.$(".ratingValue strong span").then(function (ans) { // rating
                    if (ans == null) {
                        return "";
                    }
                    let rate = tab.evaluate(function (ele) {
                        return ele.textContent;
                    }, ans);
                    return rate;
                });
                return rating;
            })

            movieDetails.push(rating);
            let director = tab.waitForSelector(".credit_summary_item a").then(function () {  // director
                let director = tab.$(".credit_summary_item a").then(function (ans) {
                    if (ans == null) {
                        return "";
                    }
                    let direct = tab.evaluate(function (ele) {
                        return ele.textContent;
                    }, ans);
                    return direct
                });
                return director;
            })
            movieDetails.push(director);
            return Promise.all(movieDetails);
        }).then(function (data) {
            obj["Rating"] = data[2] + "/10";
            obj["Director"] = data[3];
            obj["Length"] = data[0];
            obj["StoryLine"] = data[1];

        }).then(function () {
            count++;
            movieDatabase.push(obj);
            if (count == 50) {
                fs.writeFileSync("movieDatabase.json", JSON.stringify(movieDatabase));
            }
            resolve();
        })


    })
}
