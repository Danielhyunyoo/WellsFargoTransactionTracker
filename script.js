// Array -> Stores all previous transactions -> Initially empty
let transactions = [];

// Database (storage) variable
let db = null;

// This runs instantly once the html page is done loading
document.addEventListener('DOMContentLoaded', function()
{  
    // Calling the function that sets up our database
    initDatabase();
});

// Function will run when we select/choose a CSV file
function handleFileUpload(event)
{
    // Grabbing the file we selected
    const file = event.target.files[0];

    // Checking if the file was actually grabbed
    if (!file)
    {
        alert ('Error: No File Found or Selected')
        return;
    }

    // Checking if the file is a CSV file
    if (!file.name.toLowerCase().endsWith('.csv'))
    {
        alert ('Error: Choose Valid CSV File Please')
        return;
    }

    // FileReader -> API that can read files
    const reader = new FileReader();

    // When file is fully loaded up -> This shit runs
    reader.onload = function(e)
    {
        // e.target.result -> The textual content of the CSV file that was uploaded
        const csvText = e.target.result;

        // Parsing the csv text into data
        parseCSV(csvText);
    };

    // Reading the file as though it were text
    reader.readAsText(file);
}

// Converting all CSV text into an array of 'transaction' objects to manipulate
function parseCSV(csvText)
{
    // Splitting the CSV file into lines -> Each line is a new row
    const lines = csvText.split('\n');

    // Counter variable to see how many new transactions we need to add
    let newTransactionCount = 0;

    // We skip the header row -> index 0
    // Process each subsequent row
    for (let x = 1; x < lines.length; x++)
    {
        // Grab current line
        const line = lines[x].trim();

        // Skip all empty lines
        if (line === '')
            continue;

        // Splitting each line by commas
        const columns = line.split(',');

        //! Wells Fargo format -> Date | Amount | * | "" | Description
        if (columns.length >= 5)
        {
            // Making transaction object
            const newTransaction = 
            {   
                // Removing quotes and trimming off whitespace
                date: columns[0].replace(/"/g, '').trim(),
                description: columns[4].replace(/"/g, '').trim(),
                amount: columns[1].replace(/"/g, '').trim(),

                // Autocategorization Feature
                // If a keyword matches, use the new description
                // If not, leave it empty
                customDescription: autoCategorizeTransactions(columns[4].replace(/"/g, '').trim())
            };

            // Checking if the transaction alr exists somewhere
            const isDuplicate = isTransactionDuplicate(newTransaction);

            // We only add transactions that arent duplicates
            if (!isDuplicate)
            {
                // Add to our array
                transactions.push(newTransaction);

                // Save that shit to the database
                saveTransactionToDatabase(newTransaction);

                // Update counter for new transactions
                newTransactionCount++;
            }
            else
            {
                //! Debug -> We skipped a duplicate here
                console.log ('Skipped Duplicate Transaction', newTransaction.description.substring(0, 50) + '...');
            }
        }
    }

    // Showing how many new transactions we added
    if (newTransactionCount > 0)
    {
        alert(`Added ${newTransactionCount} New Transactions. Skipped Duplicates`);
    }
    else
    {
        alert('No New Transactions Found -> All Transactions Already Added');
    }

    // Displaying the table
    displayTransactions();
}

function isTransactionDuplicate(newTransaction)
{
    // Looping thru all our transactions
    for (let x = 0; x < transactions.length; x++)
    {
        const existingTransaction = transactions[x];

        // Comparing: DATE | AMOUNT | DESCRIPTION to find duplicates -> All must match
        const sameDate = existingTransaction.date === newTransaction.date;
        const sameAmount = existingTransaction.amount === newTransaction.amount;
        const sameDescription = existingTransaction.description === newTransaction.description;

        // If it all matches -> We got a duplicate
        if (sameDate && sameAmount && sameDescription)
        {
            console.log('Found Duplicate - Date;', newTransaction.date, 'Amount:', newTransaction.amount);

            // We have a transaction that already exists
            return true;
        }
    }

    // Otherwise we got a new transaction
    return false;
}

// Creating an HTML Table with all our transactions
function displayTransactions()
{
    // Finding the table body entry where we can add rows
    const tableBody = document.querySelector('#transactionTable tbody');

    // Clearing existing rows -> empty
    tableBody.innerHTML = '';

    // Sorting transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
    {
        const dateA = new Date (a.date);
        const dateB = new Date (b.date);

        return dateB - dateA;
    });

    // Tracking each month
    let currentMonth = null;

    // loop thru each transaction -> making table rows
    sortedTransactions.forEach((transaction, index) => 
    {
        // Grabbing the month and year from the transactions details
        // EX -> August 2025
        const transactionDate = new Date (transaction.date);
        const transactionMonth = transactionDate.toLocaleString ('default', 
            {
                month: 'long',
                year: 'numeric'
            }
        );

        // Checking if transactions go into a new month
        if (currentMonth !== transactionMonth)
        {
            // Then we update the month
            currentMonth = transactionMonth;

            // Creating a month header row in the table as a line breaker
            const monthHeaderRow = document.createElement('tr');
            monthHeaderRow.className = 'month-header-row';

            // Making a single - celled row that breaks all the columns
            monthHeaderRow.innerHTML =
            `
                <td colspan = "5" class = "month-header">
                    ${transactionMonth}
                </td>
            `;

            // Adding this month row to the table
            tableBody.appendChild (monthHeaderRow);
        }

        // Making new table row
        const row = document.createElement('tr');

        // Grabbing each index in unsorted array
        const originalIndex = transactions.findIndex(t =>
        {
            t.date === transaction.date &&
            t.description === transaction.description &&
            t.amount === transaction.amount
        });

        // Setting up HTML for the row
        row.innerHTML = 
        `
                    <td>${transaction.date}</td>
                    <td>${transaction.description}</td>
                    <td class = "${getAmountColorClass(transaction.amount)}">${transaction.amount}</td>
                    <td>
                        <!-- Text input for custom description -->
                        <input type= "text"
                               class = "custom-description-input"
                               value = "${transaction.customDescription}" 
                               onchange = "updateCustomDescription(${index}, this.value)"
                               placeholder = "Add custom description...">
                    </td>
                    <td>
                        <!-- Edit button (we'll add more functionality later) -->
                        <button class = "edit-button" onclick = "editTransaction(${index})">
                            Edit
                        </button>
                    </td>
        `;

        // Adding the row we made to the table
        tableBody.appendChild(row);
    });

    // Showing the transaction table -> Cause its hidden at first
    document.getElementById('transactionSection').style.display = 'block';

    //! Debug -> Log to console so we see what exactly got loaded in
    console.log('Loaded Transactions:', transactions);
}

// Figuring out what color class a transaction amount is based on its value
function getAmountColorClass (amountString)
{
    const amount = parseFloat (amountString.replace (/"/g, '').trim());

    // Checking if the amount is valid
    if (isNaN (amount))
        return '';

    // Figuring out green or red based on value
    if (amount > 0)
        return 'positive-amount';

    else if (amount < 0)
        return 'negative-amount';

    else
        return 'no-amount';
}

// Updating custom descriptions for a specific transaction
function updateCustomDescription(index, newDescription)
{
    // Updating transaction object -> new description
    transactions[index].customDescription = newDescription;

    updateTransactionInDatabase(transactions[index]);

    //! Debug -> Logging the new change
    console.log(`Updated transaction ${index} description:`, newDescription);
}

// Placeholder function for the edit button
function editTransaction(index)
{
    // For now, just show an alert with the transaction info
    const transaction = transactions[index];

    alert(`Editing transaction: ${transaction.description}\nAmount: ${transaction.amount}`);
            
    //! Later we will add a proper edit dialog here
}

// Updates an existing transaction in our database
function updateTransactionInDatabase(transaction) 
{
    // Checking if database is ready as well as the transaction has a valid ID that was created
    if (!db || !transaction.id)
    {
        console.log('Transaction has no ID')
        return;
    }

    // Create database in readwrite
    const dbTransaction = db.transaction(['transactions'], 'readwrite');
    const objectStore = dbTransaction.objectStore('transactions');

    // Update transaction inside the database
    const request = objectStore.put(transaction);

    request.onsuccess = function(event)
    {
        console.log('Transaction Updated in Database');
    };

    request.onerror = function(event)
    {
        console.error('Error: Cant Update Transaction:', event.target.error);
    };
}

// Initializing the database -> Setting it up -> Built in browser database
function initDatabase()
{
    // Requesting to open a database called transactiontracker, version 1
    const request = indexedDB.open('TransactionTracker', 1);

    // This runs just the first time the database is made
    request.onupgradeneeded = function(event) 
    {
        // Grabbing the database collection
        db = event.target.result;
        
        // Creating a table named transactions
        const objectStore = db.createObjectStore('transactions', 
        {   
            // Each transaction has a respective ID -> used as a key
            keyPath: 'id',

            // Database automatically makes these IDs starting from 1, 2, 3, 4, ...
            autoIncrement: true
        });
        
        // Creating index for the date so we can search by date
        objectStore.createIndex('date', 'date', 
        { 
            // Meaning multiple transactions can have the same date
            unique: false 
        });
        
        //! Debug -> Successful database creation
        console.log('Database Initialized Successfully');
    };

    // Runs when the database is made successfully
    request.onsuccess = function(event) 
    {
        // Storing this database connection so we can use it in other functions
        db = event.target.result;

        //! Debug -> Successfully opened the database we made
        console.log('Database opened successfully');
        
        // Attempt to load existing transactions from the database
        loadTransactionsFromDatabase();
    };
    
    // Runs if theres trouble opening the database
    request.onerror = function(event) 
    {
        console.error('Database error:', event.target.error);

        alert('Error opening database. Using temporary storage only.');
    };
}

// Loading ALL past saved transacations from the database when the page loads
function loadTransactionsFromDatabase() 
{
    if (!db) 
    {
        console.log('Database not ready yet');
        return;
    }
    
    // Starting database transaction to readonly
    const transaction = db.transaction(['transactions'], 'readonly');

    // Getting access to the table
    const objectStore = transaction.objectStore('transactions');
    
    // Requesting to grab all transactions
    const request = objectStore.getAll();
    
    // Runs when data is received
    request.onsuccess = function(event) 
    {
        // Put data we grabbed into our array -> if not, we use empty array
        transactions = event.target.result || [];
        
        //! Debug -> Logging how many transactions we loaded
        console.log(`Loaded ${transactions.length} transactions from database`);
        
        // If we got transactions -> Display it
        if (transactions.length > 0) 
        {
            displayTransactions();
        }
    };
    
    request.onerror = function(event) 
    {
        console.error('Error loading transactions:', event.target.error);
    };
}

// Saving a single transaction to our database
function saveTransactionToDatabase(transaction) 
{
    if (!db) 
    {
        console.log('Database not ready, transaction not saved');
        return;
    }
    
    // Starting a database transaction to read and write to
    const dbTransaction = db.transaction(['transactions'], 'readwrite');

    // Getting access to the table
    const objectStore = dbTransaction.objectStore('transactions');
    
    // Request to add this transaction to the database
    const request = objectStore.add(transaction);
    
    request.onsuccess = function(event) 
    {
        transaction.id = event.target.result;
        console.log('Transaction saved to database with ID:', transaction.id);
    };
    
    request.onerror = function(event) 
    {
        console.error('Error saving transaction:', event.target.error);
    };
}

// Function that will delete all our transaction history to start fresh
function clearAllData() 
{
    // Ask user to confirm -> This will perma get rid of the table
    const confirmed = confirm("Are you sure you want to delete ALL transactions? This action cannot be undone");
    
    // If user clicked "Cancel", stop here
    if (!confirmed) 
    {
        return; // Exit function - no deletion happens
    }
    
    // Clear the transactions array
    transactions = [];
    
    // Clear the database
    if (db) 
    {
        // Closing the database with ID's
        db.close();

        // Erasing entire database ->  Resetting ID counter to 0
        const eraseDatabase = indexedDB.deleteDatabase('TransactionTracker');

        eraseDatabase.onsuccess = function()
        {
            console.log ('Successfully Deleted Transaction Database 👉 ID Counter Reset');

            // Re-making the database
            initDatabase();

            // Displaying an empty table
            displayTransactions();

            // Show an alert message to the user
            alert ('All data cleared successfully 👉 ID Counter Reset');
        };

        eraseDatabase.onerror = function()
        {
            console.error ('ERROR When Deleting Database');
            alert ('Error clearing data');
        };

        eraseDatabase.onblocked = function()
        {
            console.error ('Database Deletion Blocked 👉 Close All Tabs First');
            alert ('Close all tabs with this app open and try again!');
        };
    }
    else 
    {
        // If database isnt ready, just clear the screen
        console.log('Database not ready, only clearing display');
        displayTransactions();
        alert('Display cleared!');
    }
}

//=======================================================================================================\\

// Auto-Description Tags -> Overruling a transaction description based on specific key-words

const descriptionGuide = 
[
    // Streaming Related
    { pattern: /TWITCH TWITCH/i, description: "Monthly Twitch Subscription" },
    { pattern: /TWITCH INTERACTI/i, description: "Twitch Paycheck"},
    { pattern: /CRUNCHYROLL/i, description: "Monthly Crunchyroll Premium Subscription" },
    { pattern: /FLOSPORTS SUBSCRIP/i, description: "Monthly FloMarching Subscription"},
    { pattern: /NETFLIX/i, description: "Monthly Netflix Subscription" },
    { pattern: /HULU/i, description: "Monthly Hulu Subscription" },
    { pattern: /DISNEY/i, description: "Monthly Disney+ Subscription" },
    { pattern: /AMAZON PRIME/i, description: "Amazon Prime Membership" },
    { pattern: /YOUTUBE PREMIUM/i, description: "Monthly YouTube Premium" },

    // Gaming Related
    { pattern: /STEAM/i, description: "Online Steam Purchase"},
    { pattern: /DISCORD/i, description: "Discord Transaction"},
    { pattern: /RIOT/i, description: "Valorant Points Purchase"},
    { pattern: /PLAYSTATION/i, description: "Playstation Game Purchase"},
    { pattern: /HOYOVERSE/i, description: "Gacha Game Purchase"},
    { pattern: /XBOX/i, description: "Xbox Store Purchase" },
    { pattern: /NINTENDO/i, description: "Nintendo eShop Purchase" },
    { pattern: /EPIC GAMES/i, description: "Epic Games Store Purchase" },

    // Music Related
    { pattern: /SPOTIFY/i, description: "Monthly Spotify Premium Subscription"},

    // Work - Related
    { pattern: /TARGET/i, description: "My Target Paycheck"},

    // Food - Related
    { pattern: /COCO ICHIBANYA/i, description: "Food at Coco Ichibanya"},
    { pattern: /THE HALAL GUYS/i, description: "Food at Halal Guys"},
    { pattern: /MCDONALD/i, description: "Food at McDonalds"},
    { pattern: /SOMISOMI/i, description: "Dessert at SomiSomi"},
    { pattern: /ANDY/i, description: "Dessert at Andy's"},
    { pattern: /MUTEKI RAMEN/i, description: "Ramen at Muteki"},
    { pattern: /FIFINE/i, description: "Fifine Tech Purchase"},
    { pattern: /LINSOUL/i, description: "Linsoul IEM Purchase"},
    { pattern: /MCDONALD/i, description: "McDonald's" },
    { pattern: /STARBUCKS/i, description: "Starbucks Coffee" },
    { pattern: /CHIPOTLE/i, description: "Chipotle Mexican Grill" },
    { pattern: /SUBWAY/i, description: "Subway Sandwiches" },
    { pattern: /DOMINO/i, description: "Domino's Pizza" },
    { pattern: /PIZZA HUT/i, description: "Pizza Hut" },
    { pattern: /TACO BELL/i, description: "Taco Bell" },
    { pattern: /DOORDASH/i, description: "DoorDash Food Delivery" },
    { pattern: /UBER EATS/i, description: "Uber Eats Food Delivery" },
    { pattern: /GRUBHUB/i, description: "Grubhub Food Delivery" },

    // Transportation - Related
    { pattern: /UBER/i, description: "Uber Ride" },
    { pattern: /LYFT/i, description: "Lyft Ride" },
    { pattern: /SHELL/i, description: "Shell Gas Station" },
    { pattern: /EXXON/i, description: "Exxon Gas Station" },
    { pattern: /CHEVRON/i, description: "Chevron Gas Station" },
    { pattern: /TEXACO/i, description: "Texaco Gas Station" },

    // Retail Stores
    { pattern: /AMAZON/i, description: "Amazon Purchase" },
    { pattern: /TARGET/i, description: "Target Store" },
    { pattern: /WALMART/i, description: "Walmart Store" },
    { pattern: /BEST BUY/i, description: "Best Buy Electronics" },
    { pattern: /HOME DEPOT/i, description: "Home Depot" },
    { pattern: /LOWES/i, description: "Lowe's Home Improvement" },
    { pattern: /CVS/i, description: "CVS Pharmacy" },
    { pattern: /WALGREENS/i, description: "Walgreens Pharmacy" },

    // Financials
    { pattern: /ATM WITHDRAWAL/i, description: "ATM Cash Withdrawal" },
    { pattern: /TRANSFER/i, description: "Account Transfer" },
    { pattern: /FEE/i, description: "Bank Fee" },

    // Life Utilities
    { pattern: /ELECTRIC/i, description: "Electric Bill" },
    { pattern: /INTERNET/i, description: "Internet Bill" },
    { pattern: /PHONE/i, description: "Phone Bill" },
    { pattern: /WATER/i, description: "Water Bill" },
    { pattern: /GAS COMPANY/i, description: "Gas Bill" },

    // Misc. - Stuff for me, the owner of this program
    { pattern: /APPLE/i, description: "Apple - Related Payment"},
    { pattern: /ZELLE/i, description: "Zelle Transaction"},
    { pattern: /ICARE/i, description: "Icare - Urgent Care Visit"},
    { pattern: /UNITED EXPRESS/i, description: "Market Street Gas"},
    { pattern: /MCGRAW-HILL/i, description: "McGraw Hill Purchase (Probably Textbook)"},
    { pattern: /UT DALLAS BKSTR/i, description: "UTD Bookstore Purchase"},
    { pattern: /FLEX PARKIN/i, description: "UTD Parking Permit"},
    { pattern: /ZIPS CAR WASH/i, description: "Car Wash"},
    { pattern: /ORTHOTEXASFRISCO/i, description: "Orthopedics Visit"},
    { pattern: /BEST BUY/i, description: "Best Buy Purchase"},
    { pattern: /KWIK KAR/i, description: "Car Maintenance At Kwik Kar"},
    { pattern: /MICRO ELECTRONIC/i, description: "Microcenter Purchase"},
    { pattern: /OPENAI/i, description: "ChatGPT Token Purchase"},
    { pattern: /CDAWG/i, description: "CdawgVA Merch"},
];

// Function to automatically sort and categorize transactions based on the keyword filters above ^
function autoCategorizeTransactions(transactionDescription)
{
    // We loop through the entire descriptionGuide list
    for (let index = 0; index < descriptionGuide.length; index++)
    {
        const rule = descriptionGuide[index];

        // Logic to test if the transaction description matches any key word from the guide
        // test() -> Returns true if we have a match
        if (rule.pattern.test(transactionDescription))
        {
            // Then we have a match
            console.log (`Auto-categorization: "${transactionDescription}" 👉 "${rule.description}"`);
            return rule.description;
        }
    }

    // If the loop fails then we don't got a match - Return empty string
    console.log (`No Auto-categorization for: "${transactionDescription}"`);
    return '';
}

// Function to create a new categorization rule in descriptionGuide for future unknown purchases
function addNewDescriptionGuide (pattern, description)
{
    // Adding the new keyword filter to start of the array
    descriptionGuide.unshift ({ pattern: new RegExp(pattern, 'i'), description: description });
    console.log (`Included New Categorization KeyWord to descriptionGuide: ${pattern} 👉 ${description}`);
}


//=======================================================================================================\\

// Dark Mode Toggle

let isDarkMode = false;

// Feature -> Loading dark mode by default based on browser 
document.addEventListener ('DOMContentLoaded', function()
{
    // Checking if the user used dark mode before
    const savedMode = localStorage.getItem ('darkMode');

    if (savedMode === 'true')
        enableDarkMode();

    // Create the database
    initDatabase();
});

// Toggle button from light mode -> dark mode
function darkModeToggle()
{
    if (isDarkMode)
        disableDarkMode();
    
    else
        enableDarkMode();
}

// Enabling Dark Mode
function enableDarkMode()
{
    // Adding dark mode class to our main elements in web page
    document.body.classList.add ('dark-mode');
    document.querySelector ('.container').classList.add ('dark-mode');
    document.querySelector ('.upload-section').classList.add ('dark-mode');

    // Changing the toggle buttons text and icon
    const toggleButton = document.getElementById ('darkModeToggle');

    toggleButton.textContent = '☀︎ Light Mode';
    toggleButton.style.backgroundColor = '#ffc107';
    toggleButton.style.color = '#000';

    // Updating the toggle state
    isDarkMode = true;

    // Save user choice to browser
    localStorage.setItem ('darkMode', 'true');

    console.log ('Enabled Dark Mode Successfully');
}

// Disabling Dark Mode
function disableDarkMode()
{
    // Removing dark mode class to our main elements in web page
    document.body.classList.remove ('dark-mode');
    document.querySelector ('.container').classList.remove ('dark-mode');
    document.querySelector ('.upload-section').classList.remove ('dark-mode');

    // Changing the toggle buttons text and icon
    const toggleButton = document.getElementById('darkModeToggle');

    toggleButton.textContent = '🌙 Dark Mode';
    toggleButton.style.backgroundColor = '#6c757d';
    toggleButton.style.color = '#fff';

    // Updating the toggle state
    isDarkMode = false;

    // Save user choice to browser
    localStorage.setItem ('darkMode', 'false');

    console.log ('Enabled Light Mode Successfully');
}


