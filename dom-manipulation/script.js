//server endpoint
const API_URL = '';

let lastSyncTimestamp = Date.now();  //current timestamp in milliseconds
let isInitialSync = true;

// array of quotes(initial)
let quotes = [
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

let quoteDisplay , newQuote ,categoryFilter;


// function to generate html structure and display quote

function init() {

  quoteDisplay = document.getElementById("quoteDisplay");
  newQuote = document.getElementById("newQuote");
  categoryFilter = document.getElementById("categoryFilter");

  // Load quotes from local storage
  loadQuotes();

  newQuote.addEventListener("click", showRandomQuote);

  // Create and append add quote form
  createAddQuoteForm();

   // Create and append import/export buttons
   createImportExportButtons();

   // Populate categories dropdown
   populateCategories();

   // Load and set last selected category
   const lastCategory = localStorage.getItem('lastSelectedCategory') || 'all';
   categoryFilter.value = lastCategory;
   filterQuotes();

   // Store last viewed quote in session storage
   window.addEventListener('beforeunload', () => {
    const currentQuote = quoteDisplay.textContent;
    sessionStorage.setItem('lastViewedQuote', currentQuote);

    // Start periodic sync
    startPeriodicSync();
    
    // Add sync status indicator
    createSyncStatusIndicator();

}
  );
}

// Create sync status indicator
function createSyncStatusIndicator() {
  const statusDiv = document.createElement('div');
  statusDiv.id = 'syncStatus';
  statusDiv.className = 'sync-status';
  document.body.insertBefore(statusDiv, document.body.firstChild);
  updateSyncStatus('Initialized');
}

// Update sync status indicator
function updateSyncStatus(message, isError = false) {
  const statusDiv = document.getElementById('syncStatus');
  statusDiv.textContent = message;
  statusDiv.className = `sync-status ${isError ? 'error' : 'success'}`;
  
  // Clear error status after 5 seconds
  if (isError) {
      setTimeout(() => {
          statusDiv.className = 'sync-status';
          statusDiv.textContent = 'Synced';
      }, 5000);
  }
}

// Start periodic sync with server
function startPeriodicSync() {
  // Initial sync
  fetchQuotesFromServer();
  
  // Set up periodic sync every 30 seconds
  setInterval(syncWithServer, 30000);
}

// Sync data with server
async function fetchQuotesFromServer() {
  try {
      // Simulate fetching server data
      const response = await fetch(`${API_URL}?_start=0&_limit=5`);
      const serverData = await response.json();
      
      // Convert server data to quote format
      const serverQuotes = serverData.map(post => ({
          id: post.id,
          text: post.title,
          category: post.body.split('\n')[0],
          timestamp: Date.now()
      }));

      // Handle initial sync differently
      if (isInitialSync) {
        handleInitialSync(serverQuotes);
        isInitialSync = false;
        return;
    }

     // Merge server and local quotes
     mergeQuotes(serverQuotes);
        
     // Update sync timestamp
     lastSyncTimestamp = Date.now();
     
     // Update UI
     updateSyncStatus('Synced successfully');
     
     // Refresh display
     filterQuotes();
     
 } catch (error) {
     updateSyncStatus('Sync failed: ' + error.message, true);
 }
}

// Handle initial sync
function handleInitialSync(serverQuotes) {
  // Combine local and server quotes, keeping local ones if there's a conflict
  const mergedQuotes = [...quotes];
  
  serverQuotes.forEach(serverQuote => {
      if (!quotes.some(q => q.id === serverQuote.id)) {
          mergedQuotes.push(serverQuote);
      }
  });
  
  quotes = mergedQuotes;
  saveQuotes();
  updateSyncStatus('Initial sync completed');
}

// Merge quotes from server with local quotes
function mergeQuotes(serverQuotes) {
  let conflicts = [];
  
  serverQuotes.forEach(serverQuote => {
      const localQuote = quotes.find(q => q.id === serverQuote.id);
      
      if (!localQuote) {
          // New quote from server
          quotes.push(serverQuote);
      } else if (serverQuote.timestamp > localQuote.timestamp) {
          // Server has newer version
          conflicts.push({
              local: localQuote,
              server: serverQuote
          });
      }
  });
  
  if (conflicts.length > 0) {
      handleConflicts(conflicts);
  }
  
  saveQuotes();
}

// Handle quote conflicts
function handleConflicts(conflicts) {
  conflicts.forEach(conflict => {
      // Create conflict resolution dialog
      const dialogHTML = `
          <div class="conflict-dialog">
              <h3>Quote Conflict Detected</h3>
              <div class="conflict-versions">
                  <div class="local-version">
                      <h4>Local Version</h4>
                      <p>${conflict.local.text}</p>
                      <p>Category: ${conflict.local.category}</p>
                  </div>
                  <div class="server-version">
                      <h4>Server Version</h4>
                      <p>${conflict.server.text}</p>
                      <p>Category: ${conflict.server.category}</p>
                  </div>
              </div>
              <div class="conflict-actions">
                  <button onclick="resolveConflict(${conflict.local.id}, 'local')">Keep Local</button>
                  <button onclick="resolveConflict(${conflict.server.id}, 'server')">Use Server</button>
              </div>
          </div>
      `;
      
      const dialogDiv = document.createElement('div');
      dialogDiv.innerHTML = dialogHTML;
      document.body.appendChild(dialogDiv);
  });
}

// Resolve quote conflict
function resolveConflict(quoteId, version) {
  const conflicts = document.querySelectorAll('.conflict-dialog');
  const conflict = conflicts[0];
  
  if (version === 'server') {
      const serverQuote = quotes.find(q => q.id === quoteId);
      if (serverQuote) {
          serverQuote.timestamp = Date.now();
          updateSyncStatus('Conflict resolved with server version');
      }
  } else {
      const localQuote = quotes.find(q => q.id === quoteId);
      if (localQuote) {
          localQuote.timestamp = Date.now();
          updateSyncStatus('Conflict resolved with local version');
      }
  }
  
  // Remove conflict dialog
  conflict.remove();
  
  // Save and refresh
  saveQuotes();
  filterQuotes();
}


//function to populate categories dynamically in the dropdown
function populateCategories() {
  const categories = new Set(quotes.map(quote => quote.category));

  // console.log(categories);

  // Create default option to render 
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);

    
  })
  

}

//function to filter quotes based on the selected category
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  // console.log(selectedCategory);

  // save selected category in local storage
  localStorage.setItem('lastselectedCategory', selectedCategory);

  // Filter quotes
  const filteredQuotes = selectedCategory === 'all' 
  ? quotes 
  : quotes.filter(quote => quote.category === selectedCategory);

// Display filtered quotes
displayQuotes(filteredQuotes);
}

// Display quotes in the quote display area
function displayQuotes(quotesToShow) {
  quoteDisplay.innerHTML = '';
  
  if (quotesToShow.length === 0) {
      quoteDisplay.textContent = "No quotes available in this category.";
      return;
  }

  quotesToShow.forEach(quote => {
      const quoteDiv = document.createElement('div');
      quoteDiv.className = 'quote-item';
      
      const quoteText = document.createElement('p');
      quoteText.className = 'quote-text';
      quoteText.textContent = quote.text;
      
      const quoteCategory = document.createElement('span');
      quoteCategory.className = 'quote-category';
      quoteCategory.textContent = `Category: ${quote.category}`;
      
      quoteDiv.appendChild(quoteText);
      quoteDiv.appendChild(quoteCategory);
      quoteDisplay.appendChild(quoteDiv);
  });
}

//function to save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Load quotes from local storage
function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
      quotes = JSON.parse(savedQuotes);
  }
}

// Create and append import/export buttons
function createImportExportButtons() {
  const buttonContainer = document.querySelector('.button-container');
  const exportBtn = document.querySelector('#exportBtn');
  const importInput = document.querySelector('#importFile');

  exportBtn.addEventListener('click', exportToJsonFile);


  // const buttonContainer = document.createElement('div');
  // buttonContainer.className = 'button-container';
  
  // // Create export button
  // const exportBtn = document.createElement('button');
  // exportBtn.textContent = 'Export Quotes';
  // exportBtn.onclick = exportToJson;
  
  // Create import input
  // const importInput = document.createElement('input');
  // importInput.type = 'file';
  // importInput.id = 'importFile';
  // importInput.accept = '.json';
  // importInput.onchange = importFromJsonFile;
  
  // Create import label
  // const importLabel = document.createElement('label');
  // importLabel.textContent = 'Import Quotes';
  // importLabel.className = 'import-label';
  // importLabel.appendChild(importInput);
  
  // buttonContainer.appendChild(importLabel);
}

// Export quotes to JSON file
function exportToJsonFile() {
  const quotesJson = JSON.stringify(quotes, null, 2);
  const blob = new Blob([quotesJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'quotes.json';
  
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  
  fileReader.onload = function(e) {
      try {
          const importedQuotes = JSON.parse(e.target.result);
          
          // Validate imported data
          if (Array.isArray(importedQuotes) && 
              importedQuotes.every(quote => 
                  typeof quote === 'object' && 
                  'text' in quote && 
                  'category' in quote)) {
              quotes.push(...importedQuotes);
              saveQuotes();
              showRandomQuote();
              alert('Quotes imported successfully!');
          } else {
              throw new Error('Invalid quote format');
          }
      } catch (error) {
          alert('Error importing quotes. Please check the file format.');
      }
  };
  
  fileReader.readAsText(event.target.files[0]);
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

// Show a random quote from the list based on the selected category
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const eligibleQuotes = selectedCategory === 'all' 
      ? quotes 
      : quotes.filter(quote => quote.category === selectedCategory);

  if (eligibleQuotes.length === 0) {
      quoteDisplay.textContent = "No quotes available in this category.";
      return;
  }

  const randomIndex = Math.floor(Math.random() * eligibleQuotes.length);
  const quote = eligibleQuotes[randomIndex];

  quoteDisplay.innerHTML = '';

  const quoteText = document.createElement('p');
  quoteText.className = 'quote-text';
  quoteText.textContent = quote.text;

  const quoteCategory = document.createElement('span');
  quoteCategory.className = 'quote-category';
  quoteCategory.textContent = `Category: ${quote.category}`;

  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);

  // Store current quote in session storage
  sessionStorage.setItem('lastViewedQuote', quote.text);
}

// function to add new quote
// Modified addQuote function to include ID and timestamp

function addQuote() {
  const quoteText = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  //validation check for empty fields(text and category)
  if (!quoteText || !category) {
    alert('Please enter a quote text and provide its category.');
    return;
  }

  const newQuote = {
    id: Date.now(),  //Uses Timestamp as ID
    text: quoteText,
    category: category,
    timestamp: Date.now()
  };

  quotes.push(newQuote);
  

  //add new quote to the array  
  // quotes.push({ text: quoteText, category: category });

  // Save quotes to local storage
  saveQuotes();

  // Populate categories dropdown
  populateCategories();

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

  // Show success message
  updateSyncStatus('New quote added - syncing...');
    
  // Trigger immediate sync
  fetchQuotesFromServer();

  //display random quotes
  showRandomQuote();

  
}

document.addEventListener("DOMContentLoaded", init);