;(async function form (){
    try {
        const resultsContainer = document.getElementById("results_container"), resultsMsg = document.getElementById("results_message");
        const getResultCard = b => {
            return `
                <article>
                    <h3>${b.name}</h3>
                    <p>${b.brewery}</p>
                    <p>Rating: ${b.rating}/5</p>
                </article>
            `;
        };

        const replaceShortTerms = searchPhrase => {
            return searchPhrase.split(" ").filter(w => 3 <= w.length).join(" ");
        };

        const dbReq = await fetch("../db/beers.json");
        if(200 !== dbReq.status){
            document.getElementById("search_form_wrapper").innerHTML = `
            <h1>Error: ${dbReq.status}</h1>
            <p>Could not get beer list from server</p>`;
            return;
        }
        const BEERS = (await dbReq.json());

        const IDX = lunr(function() {
            this.ref("position");
            this.field("name");
            this.field("brewery");
            this.field("rating");

            BEERS.forEach((b, i) => {
              this.add({...b, position: i});  
            }, this);
        });

        document.getElementById("search_form_wrapper").innerHTML = `
        <form action="" id="search_term_form" method="GET">
            <label for="search_term">Beer Name / Brewery / Location / Type etc.</label>
            <div class="form-field">
                <span>&#x1F50E;&#xFE0E;</span>
                <input aria-describedby="search_notes" id="search_term" minlength="3" name="search-term" placeholder=" Enter something, anything!" required title="E.g. 'Bud'" type="search">
            </div>
            <small id="search_notes">Wildcard * is valid, e.g. "*berg" returns "Carlsberg".</small>
        </form>`;

        const RESULTS_LIST = resultsContainer.appendChild(document.createElement("ul")); 

        document.getElementById("search_term_form").addEventListener("input", async (e) => {
            e.preventDefault();
            // trim to prevent "stemming" of new words, esp. with * selector on empty string
            const valueToSearch = replaceShortTerms(e.target.value.trim());
 
            RESULTS_LIST.innerHTML = "";
    
            if(3 > valueToSearch.length) return;
            resultsMsg.innerText = "Searching...";

            let idxResult = IDX.search(valueToSearch), idxResultWild = IDX.search(`${valueToSearch}*`);
            console.log(idxResultWild)
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