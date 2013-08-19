//this file contains:
//1. autocomplete user and repository names
//2. process search
//3. initiate search



//AUTOCOMPLETE user and repository

$(function() {
  $.support.cors = true; //fix IE issues with cross domain calls
  $("#owner").autocomplete({
    minLength: 3,
    source: function(request, response) {
      $.ajax({
        url: "https://api.github.com/legacy/user/search/" + request.term, 
        jsonp : false,
        jsonpCallback: 'jsonCallback',
        sort: 'desc',
        success: function (json) {
          response($.map(json.users, function(item){
            return {
              value: item.username
            }
          }))
        }
      })
    }

  });


  $("#repo").focus(function(){
    var tempOwner = $('#owner')[0].value, tempRepos = [];

    $.ajax({
      url: "https://api.github.com/users/" + tempOwner + "/repos",
      dataType: "jsonp", 
      success: function(json){
        for (var i = 0, iLen = json.data.length; i < iLen; i++) {
          tempRepos.push(json.data[i].name);
        };
        return tempRepos;
      }
    }).done(function(){
      $("#repo").autocomplete({
        minLength: 0,
        source: tempRepos
      });
    })
  });

});



// process search and display search results
var resultsBox = $("#results");

function processSearch(json) {

    var commitMessages = [], lookingFor = $('#query')[0].value, tempArray = [], searchResults = [];

    // create array of commit messages
    for (var i = 0, iLen = json.data.length; i < iLen; i++) {
        commitMessages.push(json.data[i].commit.message);
    }

    //return indexes of commit messages that contain string we are looking for 
    for(var i = 0, iLen = commitMessages.length; i < iLen; i++){
        if(commitMessages[i].indexOf(lookingFor) > -1){
            tempArray.push(i);
        }
    }

    // return whole commits with the same indexes
    for (var n = 0, nLen = tempArray.length; n < nLen;n++) {
        i = tempArray[n];
        //searchResults.push(json.data[i].commit);
        searchResults.push(json.data[i]);
    }

    // show results 
    resultsBox.empty();
    if (searchResults.length < 1) {
        resultsBox.css('display','block').append('<li class="result-item"><p>No commit messages found.</p></li>');
    }
    else {   
        for (var i = 0, iLen = searchResults.length; i < iLen; i++) {
            resultsBox.css('display','block').append('<li class="result-item"><h3><a href="'+ searchResults[i].html_url +'">'+ searchResults[i].commit.message +'</a></h3><p>by <b>'+ searchResults[i].commit.committer.name +'</b></p><p>'+ searchResults[i].commit.committer.date.slice(0,10) +'</p></li>');
        }
    }
}

// initiate search
$(function() { // document ready

  $('#search').submit(function() {

      //get values
      var repoName = $('#repo').value, ownerName = $('#owner').value, loader = $('#loader');

      loader.css('display','inline-block');

      $.ajax({
          url: "https://api.github.com/repos/" + ownerName + "/" + repoName + "/commits",
          dataType: "jsonp", 
          success: processSearch,
          error: function() {
              resultsBox.append('<li class="result-item"><p>Couldn\'t reach GitHub API.</p></li>');
          }
      }).done(function(){
        loader.css('display','none');
      }) 
      
      //don't reload the page
      return false;
  })

});