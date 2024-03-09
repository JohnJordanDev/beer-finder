;(function form (){
    document.getElementById("search_form_wrapper").innerHTML = `
        <form action=""  id="search_term_form" method="GET">
            <label for="search_term">Beer Name / Brewery / Location / Type etc.</label>
            <div class="form-field">
                <span>&#x1F50E;&#xFE0E;</span>
                <input aria-describedby="search_term_details" id="search_term" minlength="3" name="search-term" placeholder=" Enter something, anything!" required title="E.g. 'Bud'" type="search">
            </div>
        </form>`;
}());