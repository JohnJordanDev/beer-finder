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
const FLAVOR_TYPE = {
    crisp_or_clean: {
        description: "Crisp beers are lighter, cleaner in flavor, and crisply refreshing. They range in color from straw to amber, have low to medium abvs, and are light to medium in body.",
        subtypes: {
            fruity: [
                "Ale - Cream",
                "Ale - English Blonde",
                "Ale - American Blonde",
                "Ale - Wheat",
                "Kölsch"
            ],
            malty: [
                "Bock - Helles",
                "Lager - Pale",
                "Lager - Helles",
                "Lager - Amber",
                "Lager - Vienna",
                "Lager - Märzen"
            ],
            hoppy: [
                "Pilsner",
                "Pilsner - Imperial",
                "Lager - Kellerbier/ Zwickelbier",
                "Lager - India Pale"
            ]
        }
    },
    hoppy_or_bitter: {},
    malty_or_sweet: {},
    roasted_or_smoked: {},
    fruity_or_spiced: {},
    sour_and_funky: {}

};

try {
    const setSelectedTab = (tabButtons, tabButtonSelected) => {
        if("tab" !== tabButtonSelected.getAttribute("role")){
            return;
        }
        tabButtons.forEach(tb => {
            if(tb.id === tabButtonSelected.id){
                tb.setAttribute("aria-selected", true);
                tb.classList.add("active-tab");
                return;
            }
            tb.setAttribute("aria-selected", false);
            tb.classList.remove("active-tab");
        });
    };

    const setToSelectedTab = (tabPanels = [], tab = "tab-1") => {
        tabPanels.forEach(tp => {
            if(tab === tp.getAttribute("aria-labelledby")) {
                return tp.style.display = "block";
            }
            tp.style.display = "none";
        });
    };

    const TAB_NAV = document.getElementById("tab_nav"), 
        TABS = TAB_NAV.querySelectorAll("button"), 
        TAB_PANELS = document.querySelectorAll("[role='tabpanel']");

    setToSelectedTab(TAB_PANELS);
    setSelectedTab(TABS, TABS[0]);


    const handleTabClick = ev => {
        const tab = ev.target;
        if("tab" !== tab.getAttribute("role")){
            return;
        }
        setSelectedTab(TABS, tab);
        setToSelectedTab(TAB_PANELS, tab.id);
    };
    TAB_NAV.addEventListener("click", handleTabClick);
    

} catch(e) {
    console.log(`Error during tab creation or execution: ${e.toString()}`);
}

let BEERS;

;(async function form (){
    try {
        const RATINGS = {
            "Top Class": 5,
            "Excellent": 4.5,
            "Very Good": 4.0,
            "Good": 3.5,
            "Okay": 3.0
        };
        const resultsContainer = document.getElementById("term_results_container"), 
            resultsMsg = document.getElementById("term_results_message");

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
        BEERS = (await dbReq.json());
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
        const inputSearchName = "search-term";
        document.getElementById("search_form_wrapper").innerHTML = `
        <form action="" id="search_term_form" method="GET">
            <label for="search_term">Beer Name or Brewery</label>
            <div class="form-field">
                <span>&#x1F50E;&#xFE0E;</span>
                <input id="search_term" minlength="3" name="${inputSearchName}" placeholder=" Enter something!" required title="E.g. 'Lager' " type="search">
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
        const RESULTS_LIST = resultsContainer
            .appendChild(document.createElement("output"))
            .appendChild(document.createElement("ol")); 
        resultsContainer.querySelector("output").setAttribute("for", inputSearchName);

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
        const m = document.getElementById("term_results_message"), h = m.previousElementSibling;
        h.innerText = "An Error Occurred!";
        m.innerText = e.toString();
        document.getElementById("search_form_wrapper").style.display = "none";

    }
}());

;(async function(){
    try {
        const FLAVOR_RESULTS = document.getElementById("flavor_results_message");
        // TODO: Add description to subtype and show in UI
        const getFlavorEntries = (nameOfFlavor = "", flavor = {}) => {
            let output = `<h4>${nameOfFlavor}</h4>
                <p>${flavor.description}</p>`;
            const subTypes = flavor.subtypes;
            for(const subtype in subTypes){
                output += `<h5>${subtype}</h5>
                    <ul>`;
                subTypes[subtype].forEach(st => {
                    output += `<li>${st}</li>`;
                });
                output += "</ul>";
            }
            return output;
        };
        const flavorForm = `<form action="" method="GET">
            <label class="radio"><input checked name="flavor" type="radio" value="crisp_or_clean">Crisp <small>or</small> Clean</label>
            <label class="radio"><input name="flavor" type="radio" value="hoppy_or_bitter">Hoppy <small>or</small> Bitter</label>
            <label class="radio"><input name="flavor" type="radio" value="malty_or_sweet">Malty <small>or</small> Sweet</label>
            <label class="radio"><input name="flavor" type="radio" value="roasted_or_smoked">Roasted <small>or</small> Smoked</label>
            <label class="radio"><input name="flavor" type="radio" value="fruity_or_spiced">Fruity <small>or</small> Spiced</label>
            <label class="radio"><input name="flavor" type="radio" value="sour_or_funky">Sour <small>or</small> Funky</label>
        </form>`;
        const formWrapper = document.getElementById("flavor_form_wrapper");
        formWrapper.innerHTML = flavorForm;
        const formChangeHandler = ev => {
            const option = ev.target;
            FLAVOR_RESULTS.innerHTML = getFlavorEntries(option.value, FLAVOR_TYPE[option.value]);
        };
        formWrapper.querySelector("form").addEventListener("change", formChangeHandler);
        const initiallyChecked = formWrapper.querySelector("[checked]");
        FLAVOR_RESULTS.innerHTML = getFlavorEntries(initiallyChecked.value, FLAVOR_TYPE[initiallyChecked.value]);

    } catch(e) {
        console.log(`Error in Flavor Form: ${e.toString()}`);
    }
}());
