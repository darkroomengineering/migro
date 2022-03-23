# into-contentful
Script for migrating data from X-CMS to Contentful via the CMA-API.

This code uses a TSV-file (tab separated value) with data exported from X-CMS and imports it into Contentful.

Migration involves two steps:

- First, parsed the TSV-file into a JSON file with contentful structure. This steps involves data munging and creating the necesary content each 
case needs. For example, a blog may have author information as a separate content type. Thus first we need to create this asset to obtain the Id to link
it to the corresponding blog.

- Second, use the corresponding JSON file to create the entries.

## TSV file config:

- The TSV-file first row are the fields name your file has (never used, is just for an easier set up of the following row).
- The TSV-file second row are the fields name of the entry to be migrated and they will be accesible from the code.
- TSV-file has to be saved inside input folder.

See the following image as an example for migrating a blog:
![Screen Shot 2022-03-23 at 20 15 25](https://user-images.githubusercontent.com/64488427/159787794-6d72e040-6b8a-407d-a9b7-5b79d43702cb.png)

## Data Munging (First Step)

The script reads the TSV-file and returns a function with arguments row and parsed. 

- row: These are the rows of the TSV-file as an object where the keys are the second column you setted up on the TSV-file. Following the example above, 
this object will look like:

```js script
row = {title: 'this is title', internalReferenceTitle: 'this is internalReferenceTitle', urlSlug: 'slug', contentTypes: 'e-commerce',
 featuredImage: 'url to image', body: 'html of blog body' publishData: 'October 21, 2015', author: 'guido Fier'}
```

- parsed: This is an array where you have to push wrangled data with the correct format for each field corresponding to the entry on contentful.

In the data-munging.js file, inside the myDataMunging function you can set the structure of the json which will be used to migrate data. Also, you can 
define helpers functions inside this file to be used inside myDataMunging. Rembember that you will be using row, parse it and then push 
it into parsed array. 

On the src/utils.js file you have some helper functions for wrangling data, creating assets and entries.

## Configuration

In the index.js file at the root folder you have to set up the following variables:

- TSVdataFileName: file name with raw data, String.
- entryTarget: Content Type name (from contentful content model) for entry to migrate, String.

optionals:
- batchSize: Number.
- offset: Number.

Code runs batchs of step 1 and step 2. By default it will run a batch of 10 rows for first step and then will execute step 2 for these rows. This way
is easier to detect errors and not loose progress because of them. 
Offset variable allows to select from which batch step the code will start working.

## Environment Variables

Create a .env file on the root folder with the following variables:

- ACCESS_TOKEN = This is the CMA access token of contentful, watch out is not the same as the other APIs.
- ENVIRONMENT_ID = The Environment ID from the space we are migrating into.
- SPACE_ID = The Space ID of the Contentful organization.

