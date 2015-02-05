
var cells      = document.getElementsByClassName("clcellprimary");
var length     = cells.length;
var professors = [];
var profCount  = 0;
var popup;
var firstName;
var department;
var number;
var name;
var courses    = [];

// Loop through to add buttons below professor names

if (document.URL == "https://my.sa.ucsb.edu/gold/ResultsFindCourses.aspx") {
	var spans = document.getElementsByTagName("span");
	for (var i = 0; i < spans.length; i++) {
		var span = spans[i];
		if (span.className == "tableheader") {
			var parent = span;
			for (var j = 0; j < 13; j++)
				parent = parent.parentNode;
			var split = span.innerHTML.split(/\s+/)
			courses.push({"department": split[0], "number": split[1], "parent": parent});
		}
	}

	for (var i = 3; i < length; i += 18) {                   //only iterate through cells which contain a professor name
		var profName = cells[i].innerText.slice(0,-1);        //slice '&nbsp;'' character		
		if (profName != 'T.B.A.' && profName != 'Cancel'){
			var parent = cells[i];
			for (var j = 0; j < 11; j++)
				parent = parent.parentNode;
			for (var j = 0; j < courses.length; j++) {
				if (courses[j].parent == parent) {
					department = courses[j].department;
					number = courses[j].number;
				}
			}
		    professors.push(profName.slice(0,-1));               //slice remaining space at end & push to professor array
		    var div         = cells[i+9];                        //cell where the button will go
		    var searchName  = '';
		    var nameArray   = professors[profCount].split(' ');  //check if professor's last name is two words to include in search
		    if (nameArray.length == 1){                          //special case for single name on gold
				searchName    = nameArray[0];
				div.firstName = ' ';
		    } else if (nameArray[1].length > 1){ 
				searchName    = nameArray[0] + ' ' + nameArray[1]; 
				div.firstName = nameArray[2];
		    } else { 
				searchName    = nameArray[0];
				div.firstName = nameArray[1];
		    }
		    
		    div.searchURL = 'http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+california+santa+barbara&queryoption=HEADER&query='
	                + searchName + '&facetSearch=true';
	        div.department = department;
	        div.number     = number;
	        div.lastName   = searchName;
		    div.profURL   = '';
		    div.innerHTML = '<input class="ratingButton" type="button" value="SHOW RATING" />';
		    div.cell      = cells[i+10];                          //cell where the popup's html will be placed
		    div.clicked   = false;
		    div.addEventListener('click', openPopup);
		    profCount++;
		} //end if
	}  //end for

}

function openPopup() {
    if (this.clicked == true) {                              //happens when button was clicked while active
		this.cell.innerHTML = '';
		this.innerHTML      = '<input class="ratingButton" type="button" value="SHOW RATING" />';
		this.clicked        = false;
    } else {                                                  //happens when button was clicked while inactive
		name = this.lastName + " " + this.firstName;
		this.clicked    = true;
		this.innerHTML  = '<input class="ratingButton" type="button" value="HIDE RATING" />';
		popup       = document.createElement('div');
		popup.className = 'popup';
		popup.id = name;
		popup.innerText = 'Loading...';
		firstName   = this.firstName;
		this.cell.style.position = 'relative';
		this.cell.appendChild(popup);
		department = this.department;
		number = this.number;
		var dataArray = [this.searchURL, "parseSearchResponseHTML"];
		safari.self.tab.dispatchMessage("parseSearchResponseHTML", dataArray); //end message
		var secondDataArray = ["https://www.myedu.com/UCSB-University-of-California-Santa-Barbara/school/255/course/by-department/",
		                       "parseMyEduSchoolResponseHTML"];
		safari.self.tab.dispatchMessage("parseMyEduSchoolResponseHTML", secondDataArray);
	} //end else
} //end openPopup()

function parseMyEduSchoolResponseHTML(messageEvent) {
	if (messageEvent.name == "parseMyEduSchoolResponseHTML") {
		var responseText = messageEvent.message;
		var regexp = /<a class="abbreviation" href="(.*)">\s+(.*)\s+<\/a>/g;
		var match = regexp.exec(responseText);
		var foundlink;
		while (match != null) {
			if (match[2] == department) {
				foundlink = "https://www.myedu.com" + match[1];
			}
			match = regexp.exec(responseText);
		}
		var dataArray = [foundlink, "parseMyEduDepartmentResponseHTML"];
		safari.self.tab.dispatchMessage("parseMyEduDepartmentResponseHTML", dataArray);
	}
}

function parseMyEduDepartmentResponseHTML(messageEvent) {
	if (messageEvent.name == "parseMyEduDepartmentResponseHTML") {
		var responseText = messageEvent.message;
		var regexp = /<a class="abbreviation" href="(.*)">\s+(.*)\s+<\/a>/g;
		var match = regexp.exec(responseText);
		var foundlink;
		while (match != null) {
			if (match[2] == number) {
				foundlink = "https://www.myedu.com" + match[1];
			}
			match = regexp.exec(responseText);
		}
		var dataArray = [foundlink, "parseMyEduCourseResponseHTML"];
		safari.self.tab.dispatchMessage("parseMyEduCourseResponseHTML", dataArray);
	}
}

function parseMyEduCourseResponseHTML(messageEvent) {
	if (messageEvent.name == "parseMyEduCourseResponseHTML") {
		var responseText = messageEvent.message;
		var regexp = /<tbody id=\"[a-z0-9\-]+\" class=\"list\"\s+data-w=\"(.*)\"\s+data-gpa=\"(.*)\"\s+data-past_year=\"(.*)\"\s+data-recs=\"(.*)\"\s+data-name=\"(.*)\"\s+shown=\"(.*)\"\s+>/g;
		var match = regexp.exec(responseText);
		var gpa;
		var count = 0;
		while (match != null) {
			if (match[5].toLowerCase() == name.toLowerCase()) {
				gpa = match[2];
				break;
			}
			count++;
			match = regexp.exec(responseText);
		}
		regexp = /<img lsrc=\"(.*)\"\s+alt=\".*\"\s+class=\"chart detail\"\s+\/>/g;
		match = regexp.exec(responseText);
		var image;
		var i = 0;
		while (match != null) {
			if (i == count) { 
				image = match[1];
				break;
			}
			i++
			match = regexp.exec(responseText);
		}
		if (gpa) {
			popup.style.height = "225px";
			popup.style.width = "330px";
			var gpaDiv = document.createElement('div');
			var gpaTitleDiv = document.createElement('div');
			var gpaTextDiv = document.createElement('div');
			gpaDiv.className = 'gpa';
			gpaTitleDiv.className = 'title';
			gpaTextDiv.className = 'text';
			gpaTitleDiv.innerText = 'GPA';
			gpaTextDiv.innerText = gpa;
			gpaTitleDiv.appendChild(gpaTextDiv);
			gpaDiv.appendChild(gpaTitleDiv);
			popup.appendChild(gpaDiv);
			if (image) {
				var gpaImageDiv = document.createElement('div');
				gpaImageDiv.innerHTML = "<img src=\"" + image + "\" />";
				gpaImageDiv.className = "gpaimage";
				popup.appendChild(gpaImageDiv);
			}
			var popups = document.getElementsByClassName("popup");
		}
	}
}

// Called as the callback of the request to search RateMyProfessor
function parseSearchResponseHTML(messageEvent) {

	if (messageEvent.name == "parseSearchResponseHTML") {

		

		var responseText = messageEvent.message;

	    var tmp          = document.createElement('div');  //make a temp element so that we can search through its html
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
		} else { //iterate through the search results and match by first letter of first name to verify identity
			var length = foundProfs.length;
	    	for (var i = 0; i < length; i++) {
		   		var tmp       = document.createElement('div');
		   		tmp.innerHTML = foundProfs[i].innerHTML;
		   		var name      = tmp.getElementsByClassName('main')[0].innerText;
				if (firstName.charAt(0) == name.split(',')[1].charAt(1)){ 
					break;
				} else if (i == length-1) {
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
	    	var dataArray = [this.profURL, "parseProfessorResponseHTML"];
			safari.self.tab.dispatchMessage("parseProfessorResponseHTML", dataArray);
		} //end else
	} // End if event name is correct
} // End function

//Called as the callback of the request to get the professor's page
function parseProfessorResponseHTML(messageEvent) {

	if (messageEvent.name == "parseProfessorResponseHTML") {

		var responseText = messageEvent.message;

		tmp = document.createElement('div');
		tmp.innerHTML = responseText;
		var proffName = tmp.getElementsByClassName('pfname')[0].innerText;
		var proflName = tmp.getElementsByClassName('plname')[0].innerText;
		var ratingInfo = tmp.getElementsByClassName('left-breakdown')[0];
		var numRatings = tmp.getElementsByClassName('table-toggle rating-count active')[0].innerText;
		tmp.innerHTML = ratingInfo.innerHTML;

		//get the raw rating data
		var overallAndAvg = tmp.getElementsByClassName('grade');
		var otherRatings = tmp.getElementsByClassName('rating');

		var overall = overallAndAvg[0];
		var avgGrade = overallAndAvg[1];
		var helpfulness = otherRatings[0];
		var clarity = otherRatings[1];
		var easiness = otherRatings[2];
		tmp.remove();

		//create the ratings divs
		var profNameDiv = document.createElement('div');
		var overallDiv = document.createElement('div');
		var overallTitleDiv = document.createElement('div');
		var overallTextDiv = document.createElement('div');
		var avgGradeDiv = document.createElement('div');
		var avgGradeTitleDiv = document.createElement('div');
		var avgGradeTextDiv = document.createElement('div');
		var helpfulnessDiv = document.createElement('div');
		var helpfulnessTitleDiv = document.createElement('div');
		var helpfulnessTextDiv = document.createElement('div');
		var clarityDiv = document.createElement('div');
		var clarityTitleDiv = document.createElement('div');
		var clarityTextDiv = document.createElement('div');
		var easinessDiv = document.createElement('div');
		var easinessTitleDiv = document.createElement('div');
		var easinessTextDiv = document.createElement('div');
		var numRatingsDiv = document.createElement('div');


		//assign class names for styling
		profNameDiv.className = 'heading';
		overallDiv.className = 'overall';
		overallTitleDiv.className = 'title';
		overallTextDiv.className = 'text';
		avgGradeDiv.className = 'avgGrade';
		avgGradeTitleDiv.className = 'title';
		avgGradeTextDiv.className = 'text';
		helpfulnessDiv.className = 'helpfulness';
		helpfulnessTitleDiv.className = 'title';
		helpfulnessTextDiv.className = 'text';
		clarityDiv.className = 'clarity';
		clarityTitleDiv.className = 'title';
		clarityTextDiv.className = 'text';
		easinessDiv.className = 'easiness';
		easinessTitleDiv.className = 'title';
		easinessTextDiv.className = 'text';
		numRatingsDiv.className = 'numRatings';

		//put rating data in divs
		profNameDiv.innerHTML = '<a href="' + this.profURL + '" target="_blank">' + proffName + " " + proflName; + '</a>';
		overallTitleDiv.innerText = 'Overall Quality';
		overallTextDiv.innerText = overall.innerHTML;
		avgGradeTitleDiv.innerText = 'Average Grade';
		avgGradeTextDiv.innerText = avgGrade.innerHTML;
		helpfulnessTitleDiv.innerText = 'Helpfulness';
		helpfulnessTextDiv.innerText = helpfulness.innerHTML;
		clarityTitleDiv.innerText = 'Clarity';
		clarityTextDiv.innerText = clarity.innerHTML;
		easinessTitleDiv.innerText = 'Easiness';
		easinessTextDiv.innerText = easiness.innerHTML;

		numRatings = numRatings.slice(9).split(' ')[0] //check to see if "ratings" is singular or plural
		if (numRatings == '1') {
		    numRatingsDiv.innerHTML = '<a href="' + this.profURL + '" target="_blank">' + numRatings + ' rating</a>';
		} else {
		    numRatingsDiv.innerHTML = '<a href="' + this.profURL + '" target="_blank">' + numRatings + ' ratings</a>';
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


	 }
}

safari.self.addEventListener("message", parseMyEduSchoolResponseHTML, false);
safari.self.addEventListener("message", parseMyEduDepartmentResponseHTML, false);
safari.self.addEventListener("message", parseMyEduCourseResponseHTML, false);
safari.self.addEventListener("message", parseProfessorResponseHTML, false);
safari.self.addEventListener("message", parseSearchResponseHTML, false);
