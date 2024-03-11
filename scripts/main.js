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
        document.getElementById("search_form_wrapper").innerHTML = `
        <form action=""  id="search_term_form" method="GET">
            <label for="search_term">Beer Name / Brewery / Location / Type etc.</label>
            <div class="form-field">
                <span>&#x1F50E;&#xFE0E;</span>
                <input id="search_term" minlength="3" name="search-term" placeholder=" Enter something, anything!" required title="E.g. 'Bud'" type="search">
            </div>
        </form>`;

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

        const RESULTS_LIST = resultsContainer.appendChild(document.createElement("ul")); 


        document.addEventListener("submit", e => {
            e.preventDefault();
            const st = e.target.elements[0];
            if("search-term" === st.getAttribute("name")) {
                resultsMsg.innerText = "Searching...";
                RESULTS_LIST.innerHTML = "";
                // TODO: issue here is that * will NOT return results for well-formed term, and
                // will only return FIRST match for part-term with current logic
                let idxResult = IDX.search(st.value);
                idResult = idxResult.length ? idxResult : IDX.search(`${st.value}*`); 
                if(!idxResult.length){
                    return resultsMsg.innerText = `No results for "${st.value}".\n\nTry searching for something else.`;
                }
                resultsMsg.innerText = "Results found:";
                idxResult.map(r => {
                    const IDX_Pos = r.ref, l = document.createElement("li");
                    l.innerHTML = getResultCard(BEERS[IDX_Pos]);
                    RESULTS_LIST.append(l);
                });
            }
            
        });
    } catch(e) {
        console.error(`error in 'form' module: ${e.toString()}`);
    }
}());