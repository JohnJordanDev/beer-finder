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
                    <h3>${b.Name}</h3>
                    <p class="brewery-note"><span>by:</span> ${b.Brewery}</p>
                    <p>${b.Type}</p>
                    <div class="ratings">
                        <p>${getAlcoholPerCent(b["Alcohol %"])} %</p>
                        <p>${getRating(b.Rating)}/5</p>
                    </div>
                </article>
            `;
        };

        const replaceShortTerms = searchPhrase => {
            return searchPhrase.split(" ").filter(w => 1 <= w.length).join(" ");
        };

        const dbReq = await fetch("../db/beer-list.json");
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
                console.log(RATINGS)
            }
        }));

        const IDX = lunr(function() {
            // position is added to the individual beer record later...
            this.ref("position");
            this.field("Name");
            this.field("Brewery");
            this.field("Rating");
            this.field("Type");
            // .. position added here.
            BEERS.forEach((b, i) => {
              this.add({...b, position: i});  
            }, this);
        });

        document.getElementById("search_form_wrapper").innerHTML = `
        <form action="" id="search_term_form" method="GET">
            <label for="search_term">Name / Brewery / Location / Type</label>
            <div class="form-field">
                <span>&#x1F50E;&#xFE0E;</span>
                <input aria-describedby="search_notes" id="search_term" minlength="3" name="search-term" placeholder=" Enter something, anything!" required title="E.g. 'Bud'" type="search">
            </div>
            <small id="search_notes">Wildcard * is valid, e.g. "*berg" returns "Carlsberg".</small>
        </form>`;

        const RESULTS_LIST = resultsContainer.appendChild(document.createElement("ol")); 

        document.getElementById("search_term_form").addEventListener("input", async (e) => {
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