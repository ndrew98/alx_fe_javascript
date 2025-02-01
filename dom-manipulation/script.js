// array of quotes(initial)
const quotes = [
  { text: "Life is what happens while you're busy making other plans.", category: "Life" },
  { text: "The only way to do great work is to love what you do.", category: "Work" },
  { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
  { text: "Stay hungry, stay foolish.", category: "Motivation" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Failure" },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', category: "Dreams" },
  { text : 'One day you will face many defeats but remember that defeat is a stepping stone to victory.', category: "Victory" },
  { text : 'One day , the son will be greater than his father.', category: "Inheritance" }
];


// generate html structure and  display quote
// setting initial variables 

let quoteDisplay , newQuote ;


// function to generate html structure and display quote

function init() {

  quoteDisplay = document.getElementById("quoteDisplay");
  newQuote = document.getElementById("newQuote");

  newQuote.addEventListener("click", showRandomQuote);

  showRandomQuote();

  createAddQuoteForm();

}

//creating add quote form

function createAddQuoteForm() {
  // Create form container
  const formContainer = document.createElement('div');
  formContainer.className = 'js-quote-form';

  formContainer.innerHTML = `
    <input type="text" id="newQuoteText" placeholder="Enter a new quote">
    <input type="text" id="newQuoteCategory" placeholder="Enter quote category">
    <button onclick="addQuote()">Add Quote</button>
`;
document.body.appendChild(formContainer);
}

// function to show random quote

function showRandomQuote() {
  //condition to check if array is empty
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available. Add some quotes first.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  //clear previous quote/existing quote if any
  quoteDisplay.textContent = "";

  //creating an html structure to render a quote and its category
  const quoteText = document.createElement("p");
  quoteText.textContent = quote.text;

  const quoteCategory = document.createElement('span');
  quoteCategory.className = 'quote-category';
  quoteCategory.textContent = `Category: ${quote.category}`

  //appending quote and category to quoteDisplay
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

// function to add new quote

function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  //validation check for empty fields(text and category)
  if (!quoteText || !category) {
    alert('Please enter a quote text and provide its category.');
    return;
  }
  

  //add new quote to the array  
  quotes.push({ text: quoteText, category: category });

  //clear input fields after submission or enter key press
  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';

  //Display Success mesage 
  const successMessage = document.createElement('p');
  successMessage.className = 'success-message';
  successMessage.textContent = 'Quote added successfully!';
  document.body.appendChild(successMessage);

  //remove success message after 3 seconds
  setTimeout(() => {
    document.body.removeChild(successMessage);
  }, 3000);

  //display random quotes
  showRandomQuote();

  
}

document.addEventListener("DOMContentLoaded", init);