# WellsFargoTransactionTracker
Personal banking transaction tracker, tailored for specifically Wells Fargo CSV imports.

# Why Use This?
Have you ever looked at your transaction history on your Wells Fargo app or even on their website and realize, "Hey, these transaction descriptions SUCK!"

Well, I also thought the same thing. This web application fixes that issue.

# Try It Live!
[Navigate Here](https://danielhyunyoo.github.io/WellsFargoTransactionTracker/)

## Features
- **CSV Importing** 👉 Capable of taking imports for Wells Fargo CSV files (.csv)
- **Auto-Categorization** 👉 Automatically categorizes transactions (like Spotify, Netflix, Steam, etc) and creates custom-made transaction descriptions
- **Browser Storage** 👉 Transaction data is 100% FULLY saved on your browser
- **Dark & Light Mode Toggles** 👉 Toggle button for changing themes
- **Monthly Organization** 👉 Transaction table is separated and organized by month and year
- **Transaction Amount Colors** 👉 Gained money? It's green. Lost money? It's red

## How To Use
1. On Wells Fargo's website, proceed to **Accounts 👉 Manage Accounts 👉 Download Account Activity**
2. Choose your account that you want to keep track of
3. Select a date range for your transaction history
4. Select a file format 👉 **Comma delimitted**
5. Import your CSV file to the transaction app
6. Add custom transaction descriptions where necessary
7. **YOUR DATA SAVES AUTOMATICALLY**

## Adding Your Own Transaction Descriptions
When you download the files, look out for "script.js"!
- Scroll down to find "const descriptionGuide = ..."
- There, you can add more to the already big list of key words and filters along with your custom description!

## Language(s) Used...
- Purely made with HTML/CSS & mainly JavaScript
- IndexedDB 👉 You can have local storage!
- No dependencies

### License
- MIT License 👉 Please feel free to use and/or modify code!
