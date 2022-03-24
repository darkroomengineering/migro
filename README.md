# into-contentful
Script for Bulk modifications in Contentful via the CMA-API.

## Data Munging 

The script fetchs data from Contentful and returns a function with arguments row and parsed. 

- row: These are the items of all the entries that match the Entry Type.
- parsed: This is an array where you have to push wrangled data with the updated data.

In the data-munging.js file, inside the myDataMunging function you can set the structure of the json which will be used to update. Also, you can 
define helpers functions inside this file to be used inside myDataMunging. Rembember that you will be using row, parse it and then push 
it into parsed array. 

On the src/utils.js file you have some helper functions for wrangling data, creating assets and entries.

## Configuration

In the index.js file at the root folder you have to set up the following variables:

- TSVdataFileName: file name with raw data, String.
- contentTypeId: Content Type name (from contentful content model) for entry to migrate, String.

optionals:
- batchSize: Number.
- offset: Number.

Code runs batchs of step 1 and step 2. By default it will run a batch of 20 rows for first step and then will execute step 2 for these rows. This way
is easier to detect errors and not loose progress because of them. 
Offset variable allows to select from which batch step the code will start working.

## Environment Variables

Create a .env file on the root folder with the following variables:

- ACCESS_TOKEN = This is the CMA access token of contentful, watch out is not the same as the other APIs.
- ENVIRONMENT_ID = The Environment ID from the space we are migrating into.
- SPACE_ID = The Space ID of the Contentful organization.
