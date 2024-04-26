/*
    TODO:
    - Add "flavor" tab, with following flavors:
        - crisp & clean
        - hoppy or bitter
        - malty or sweet
        - roasted or smokey
        - fruity or spiced
        - sour or funky
        as radio button

    - Add "flavor" to main beer modal, based on mappings in an object (https://www.splendidtable.org/story/2013/03/21/the-7-flavor-categories-of-beer-what-they-are-how-to-pair-them)
*/
;(async function form (){
    try {
        const RATINGS = {
            "Top Class": 5,
            "Excellent": 4.5,
            "Very Good": 4.0,
            "Good": 3.5,
            "Okay": 3.0
        };
        const resultsContainer = document.getElementById("results_container"), 
            resultsMsg = document.getElementById("results_message");

        const getAlcoholPerCent = perCent => {
            return perCent ? perCent :"-.-";
        };
        const getRating = rating => {
            return RATINGS[rating] ? RATINGS[rating] : "?";
        };

        const getResultCard = b => {
            return `
                <article>
                    <img alt="${b.Name}" />
                    <div class="beer-info">
                        <h3>${b.Name}</h3>
                        <p class="brewery-note"><span>by:</span> ${b.Brewery}</p>
                        <p>${b.Type}</p>
                        <div class="ratings">
                            <p>${getAlcoholPerCent(b["Alcohol %"])} %</p>
                            <p>${getRating(b.Rating)}/5</p>
                        </div>
                    </div>
                    <footer><button href="#" data-action="modal:open" data-position="${b.position}">Read more…</button></footer>
                </article>
            `;
        };

        const replaceShortTerms = searchPhrase => {
            return searchPhrase.split(" ").filter(w => 1 <= w.length).join(" ");
        };

        const dbReq = await fetch("db/beer-list.json");
        if(200 !== dbReq.status){
            document.getElementById("search_form_wrapper").innerHTML = `
            <h1>Error: ${dbReq.status}</h1>
            <p>Could not get beer list from server</p>`;
            return;
        }
        const BEERS = (await dbReq.json());
        console.log("Beers are: ", BEERS);
        console.log(Object.entries(BEERS).forEach(e => {
            const type = e[1].Rating;
            if(!RATINGS[type]) {
                RATINGS[type] = type;
            }
        }));

        const IDX = lunr(function() {
            // position is added to the individual beer record later...
            this.ref("position");
            this.field("Name");
            this.field("Brewery");
            // .. position added here.
            BEERS.forEach((b, i) => {
              this.add({...b, position: i});  
              b.position = i;
            }, this);
        });

        document.getElementById("search_form_wrapper").innerHTML = `
        <form action="" id="search_term_form" method="GET">
            <label for="search_term">Name / Brewery / Location / Type</label>
            <div class="form-field">
                <span>&#x1F50E;&#xFE0E;</span>
                <input id="search_term" minlength="3" name="search-term" placeholder=" Enter something!" required title="E.g. 'Lager' " type="search">
            </div>
        </form>`;
        document.getElementById("search_term_form").addEventListener("submit", (e) => e.preventDefault());



        // Beer modal behavior (closing handled via form[method=dialog])
        const getBeerModalContent = b => {
            return `
            <div><form method="dialog"><button id="close_modal" autofocus>✖</button></form></div>
            <img alt="${b.Name}" />
            <h3>${b.Name}</h3>
            <p class="brewery-note"><span>by:</span> ${b.Brewery}</p>
            <p>${b.Type}</p>
            <div class="ratings">
                <p>${getAlcoholPerCent(b["Alcohol %"])} %</p>
                <p>${getRating(b.Rating)}/5</p>
            </div>
            <hr>
            <h4>Description/Review:</h4>
            <p><br>${b.Description}</p>
            `;
        };

        const BEER_MODAL = document.createElement("dialog");
        BEER_MODAL.innerHTML = `
            <div data-action="focus:trap" tabindex="0"></div>
            <div id="modal_content"></div>
            <div data-action="focus:trap" tabindex="0"></div>
        `;

        document.body.appendChild(BEER_MODAL);

        const focusTrapHandler = elem => {
            elem.addEventListener("focus", e => {
                if("focus:trap" === e.target.dataset.action) {
                    BEER_MODAL.querySelector("#close_modal").focus();
                }
            });
        };
        BEER_MODAL.querySelectorAll(`[data-action="focus:trap"]`).forEach(focusTrapHandler);

        const modalClickHandler = (e) =>{
          var rect = e.target.getBoundingClientRect();
          const outTop = e.clientY < rect.top, 
            outRight = e.clientX > rect.right, 
            outBottom = e.clientY > rect.bottom, 
            outLeft = e.clientX < rect.left;
          console.log(outTop, outRight, outBottom, outLeft);
          if(outTop || outRight || outLeft || outBottom) {
            BEER_MODAL.close();
          }
        };
        BEER_MODAL.addEventListener("click", modalClickHandler);

        const BEER_MODAL_CONTENT = BEER_MODAL.querySelector("#modal_content");
        const RESULTS_LIST = resultsContainer.appendChild(document.createElement("ol")); 

        const resultsListClickHandler = e => {
            e.preventDefault();
            const ct = e.target, beerListPos = parseInt(ct.dataset?.position, 10);
            if("modal:open" === ct.dataset?.action && beerListPos === beerListPos) {
                BEER_MODAL_CONTENT.innerHTML = getBeerModalContent(BEERS[ct.dataset.position]);
                BEER_MODAL.showModal();
            }
        };
        RESULTS_LIST.addEventListener("click", resultsListClickHandler);


        // Search logic

        document
            .getElementById("search_term_form")
            .addEventListener("input", async (e) => {
                e.preventDefault();
                // trim to prevent "stemming" of new words, esp. with * selector on empty string
                const valueToSearch = replaceShortTerms(e.target.value.trim());
                if(!valueToSearch) {
                    resultsMsg.innerText = "Results will appear here (once you search for something)."
                }
     
                RESULTS_LIST.innerHTML = "";
                if(3 > valueToSearch.length) return;
                
                resultsMsg.innerText = "Searching...";
                let idxResult = IDX.search(valueToSearch), idxResultWild = IDX.search(`${valueToSearch}*`);
                if(idxResultWild.length > idxResult.length) {
                    idxResult = idxResultWild;
                }
                if(!idxResult.length){
                    return resultsMsg.innerText = `No results for "${valueToSearch}".\n\nTry searching for something else.`;
                }

                resultsMsg.innerText = "Results found:";
                idxResult.map(r => {
                    const IDX_Pos = r.ref, l = document.createElement("li");
                    l.innerHTML = getResultCard(BEERS[IDX_Pos]);
                    RESULTS_LIST.append(l);
                });
                
            });
    } catch(e) {
        console.error(`error in 'form' module: ${e.toString()}`);
    }
}());