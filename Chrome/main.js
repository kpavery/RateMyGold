/* RateMyGold                                                                              */
/* -Choose your UCSB courses more efficiently with ratings from RateMyProfessors.com-      */
/* Jan.31.2015                                                                             */

function main() {

	var cells      = document.getElementsByClassName('clcellprimary');
	var length     = cells.length;
	var professors = [];
	var profCount  = 0;
	
	for (var i = 3; i < length; i += 18) {                   //only iterate through cells which contain a professor name	
		var profName = cells[i].innerText.slice(0,-1);         //slice '&nbsp;'' character		
		
    if (profName != 'T.B.A.' && profName != 'Cancel'){
		  professors.push(profName.slice(0,-1));               //slice remaining space at end & push to professor array
			var div         = cells[i+9];                        //cell where the button will go
			var searchName  = '';
			var nameArray   = professors[profCount].split(' ');  //check if professor's last name is two words to include in search
      if (nameArray.length == 1){                          //special case for single name on gold
				searchName    = nameArray[0];
				div.firstName = ' ';
			}
			else if (nameArray[1].length > 1){ 
				searchName    = nameArray[0] + ' ' + nameArray[1];
        if (nameArray.length == 2){                        //when first name isnt provided, make it blank and check it later
          div.firstName = ' ';
        } 
        else{
				  div.firstName = nameArray[2];
        }
			}
			else{ 
				searchName    = nameArray[0]; 
				div.firstName = nameArray[1];
			}

			div.searchURL = 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+california+santa+barbara&queryoption=HEADER&query='
                    + searchName + '&facetSearch=true';
			div.profURL   = '';
			div.innerHTML = '<input class="ratingButton" type="button" value="SHOW RATING" />';
			div.cell      = cells[i+10];                          //cell where the popup's html will be placed
			div.clicked   = false;
			div.addEventListener('click', openPopup);
			profCount++;
		} //end if
	}  //end for
}   //end main()

function openPopup() {
	if (this.clicked == true) {                              //happens when button was clicked while active
		this.cell.innerHTML = '';
		this.innerHTML      = '<input class="ratingButton" type="button" value="SHOW RATING" />';
		this.clicked        = false;
	}
	else {                                                  //happens when button was clicked while inactive
		this.clicked    = true;
		this.innerHTML  = '<input class="ratingButton" type="button" value="HIDE RATING" />';	
		var popup       = document.createElement('div');
		popup.className = 'popup';
		popup.innerText = 'Loading...';
		var firstName   = this.firstName;
		this.cell.style.position = 'relative';
		this.cell.appendChild(popup);

		chrome.runtime.sendMessage({                          //need a separate event page to do the xmlhttprequest because of http to https issue
    		url: this.searchURL,
		}, function(responseText) {
			  
        var tmp        = document.createElement('div');  //make a temp element so that we can search through its html
   			tmp.innerHTML  = responseText;
   			var foundProfs = tmp.getElementsByClassName('listing PROFESSOR'); 
   			
   			if (foundProfs.length == 0){                     //if no results were returned, print this message
   				var emptyPopup = popup;
          emptyPopup.className = 'notFoundPopup';
          var notFound         = document.createElement('div');
          var idk              = document.createElement('div');  
          notFound.className   = 'heading';
          idk.className        = 'idk';
          notFound.innerText   = "Professor not found";
          idk.innerText        = "¯\\_(ツ)_/¯";   
          emptyPopup.innerHTML = '';
          emptyPopup.appendChild(notFound);
          emptyPopup.appendChild(idk);
   			}
   			else{//iterate through the search results and match by first letter of first name to verify identity
   				var length = foundProfs.length;
   				for (var i = 0; i < length; i++){
   					var tmp       = document.createElement('div');
   					tmp.innerHTML = foundProfs[i].innerHTML;
   					var name      = tmp.getElementsByClassName('main')[0].innerText;

   					if ((firstName.charAt(0) == name.split(',')[1].charAt(1)) || (firstName == ' ')){ break;}
   					else if (i == length-1) {
   						var emptyPopup       = popup;
              emptyPopup.className = 'notFoundPopup';
              var notFound         = document.createElement('div');
              var idk              = document.createElement('div');  
              notFound.className   = 'heading';
              idk.className        = 'idk';
              notFound.innerText   = "Professor not found";
              idk.innerText        = "¯\\_(ツ)_/¯";
		          emptyPopup.innerHTML = '';
        		  emptyPopup.appendChild(notFound);
              emptyPopup.appendChild(idk);
   						return 0;
   					} //end else if
   				}  //end for loop

   				//get the link for the actual professor page
   				var link     = tmp.getElementsByTagName('a');
   				this.profURL = 'http://www.ratemyprofessors.com/' + link[0].toString().slice(23); //this is the URL

   				chrome.runtime.sendMessage({ //make another xmlhttprequest using the actual professor link
    				url: this.profURL,
				  }, function(responseText) {
					    tmp               = document.createElement('div');
   					  tmp.innerHTML     = responseText;
   					  var proffName	    = tmp.getElementsByClassName('pfname')[0].innerText;
   					  var proflName	    = tmp.getElementsByClassName('plname')[0].innerText;
   					  var ratingInfo    = tmp.getElementsByClassName('left-breakdown')[0];
              var numRatings    = tmp.getElementsByClassName('table-toggle rating-count active')[0].innerText;
   					  tmp.innerHTML     = ratingInfo.innerHTML;

   					  //get the raw rating data
   					  var overallAndAvg = tmp.getElementsByClassName('grade');
   					  var otherRatings  = tmp.getElementsByClassName('rating');

   					  /*
              //handle hotness
				      var hotness       		= overallAndAvg[2];
   					  var isCold		  		  = /cold/.test(hotness.innerHTML);
   					  var isWarm		 		    = /warm/.test(hotness.innerHTML); 
   					  var hotnessFinal  		= " - ";
   					  if(isCold || isWarm) 	{hotnessFinal = "Not hot";}
   					  else 		    		      {hotnessFinal = "Hot";}
              */

              var scale         = " / 5.0";
   					  var overall       = overallAndAvg[0];
   					  var avgGrade      = overallAndAvg[1];
   					  var helpfulness   = otherRatings[0];
   					  var clarity       = otherRatings[1];
   					  var easiness      = otherRatings[2];
   					  tmp.remove();
 
   					  //create the ratings divs
   			      var profNameDiv         = document.createElement('div');
              var overallDiv          = document.createElement('div');
              var overallTitleDiv     = document.createElement('div');
              var overallTextDiv      = document.createElement('div');
              var avgGradeDiv         = document.createElement('div');
              var avgGradeTitleDiv    = document.createElement('div');
              var avgGradeTextDiv     = document.createElement('div');
              var helpfulnessDiv      = document.createElement('div');
              var helpfulnessTitleDiv = document.createElement('div');
              var helpfulnessTextDiv  = document.createElement('div');
              var clarityDiv          = document.createElement('div');
              var clarityTitleDiv     = document.createElement('div');
              var clarityTextDiv      = document.createElement('div');
              var easinessDiv         = document.createElement('div');
              var easinessTitleDiv    = document.createElement('div');
              var easinessTextDiv     = document.createElement('div');
              var numRatingsDiv       = document.createElement('div');


              //assign class names for styling
              profNameDiv.className         = 'heading';
              overallDiv.className          = 'overall';
              overallTitleDiv.className     = 'title';
              overallTextDiv.className      = 'text';
              avgGradeDiv.className         = 'avgGrade';
              avgGradeTitleDiv.className    = 'title';
              avgGradeTextDiv.className     = 'text';
              helpfulnessDiv.className      = 'helpfulness';
              helpfulnessTitleDiv.className = 'title';
              helpfulnessTextDiv.className  = 'text';
              clarityDiv.className          = 'clarity';
              clarityTitleDiv.className     = 'title';
              clarityTextDiv.className      = 'text';
              easinessDiv.className         = 'easiness';
              easinessTitleDiv.className    = 'title';
              easinessTextDiv.className     = 'text';
              numRatingsDiv.className       = 'numRatings';

              //put rating data in divs
              profNameDiv.innerHTML         = '<a href="'+ this.profURL + '" target="_blank">'+ proffName + " " + proflName; + '</a>';
              overallTitleDiv.innerText     = 'Overall Quality';
              overallTextDiv.innerText      = overall.innerHTML.concat(scale);
					    avgGradeTitleDiv.innerText    = 'Average Grade';
					    avgGradeTextDiv.innerText     = avgGrade.innerHTML;
					    helpfulnessTitleDiv.innerText = 'Helpfulness';
					    helpfulnessTextDiv.innerText  = helpfulness.innerHTML.concat(scale);
					    clarityTitleDiv.innerText     = 'Clarity';
					    clarityTextDiv.innerText      = clarity.innerHTML.concat(scale);
					    easinessTitleDiv.innerText    = 'Easiness';
					    easinessTextDiv.innerText     = easiness.innerHTML.concat(scale);

              numRatings = numRatings.slice(9).split(' ')[0] //check to see if "ratings" is singular or plural
              if (numRatings == '1'){
                numRatingsDiv.innerHTML     = '<a href="'+ this.profURL + '" target="_blank">'+ numRatings + ' rating</a>';
              }
              else{
                numRatingsDiv.innerHTML     = '<a href="'+ this.profURL + '" target="_blank">'+ numRatings + ' ratings</a>';
              }

					    //add divs to popup
					    popup.innerHTML = ''; //remove 'loading...' text

              overallTitleDiv.appendChild(overallTextDiv);
              overallDiv.appendChild(overallTitleDiv);          
              avgGradeTitleDiv.appendChild(avgGradeTextDiv);
              avgGradeDiv.appendChild(avgGradeTitleDiv);
              helpfulnessTitleDiv.appendChild(helpfulnessTextDiv);
              helpfulnessDiv.appendChild(helpfulnessTitleDiv);
              clarityTitleDiv.appendChild(clarityTextDiv);
              clarityDiv.appendChild(clarityTitleDiv);
              easinessTitleDiv.appendChild(easinessTextDiv);
              easinessDiv.appendChild(easinessTitleDiv);

					    popup.appendChild(profNameDiv);
   					  popup.appendChild(overallDiv);
   					  popup.appendChild(avgGradeDiv);
   					  popup.appendChild(helpfulnessDiv);
   					  popup.appendChild(clarityDiv);
   					  popup.appendChild(easinessDiv);
              popup.appendChild(numRatingsDiv);

				}); //end message
			}    //end else
		});   //end message
	}      //end else
}       //end openPopup()

main();






