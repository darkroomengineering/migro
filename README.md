# Migro
Script for migrating data or bulk modifications to existent data into Contentful via the CMA-API.

#### **WHY**

Each migration or changes to existent data is almost unique requiring coding everytime. This Script sets the basic flow and functions that can be reused doing the process easier.

We may spent lots of hours writing a code to handle migrations and bulk modifications BUT we will NEVER spent tons of hours doing a repetitive task. 

#### **PURPOSES**

- Migrate data into Contentful from TSV file:

 Migrating data from other CMS can be done by exporting the data into a TSV file and using this to populate the content in Contentful. Check [Blog migration example](https://github.com/studio-freight/into-contentful/tree/blog-example) for more information about this.

- Bulk Modification of existing Data:

 Changing existing entries of content type is done by gettin all the entries of the content type and updating the content. Check [Bulk modification example](https://github.com/studio-freight/into-contentful/tree/bulk-modifications) for more information about this.

#### **SETTING UP**

- Install:

```
pnpm i
```

- Set envs:

Use env.example for guidance. Create a .env file on the root folder with the following variables:

```
ACCESS_TOKEN = This is the CMA access token of contentful, watch out is not the same as the other APIs.
ENVIRONMENT_ID = The Environment ID from the space we are migrating into.
SPACE_ID = The Space ID of the Contentful organization.

### Only use this if migrating from one Contentful Organization to other
### These are the environment and space ID from the Organization that has the data to migrate
EXTERNAL_ENVIRONMENT_ID=The Environment ID from the space we are migrating from.
EXTERNAL_SPACE_ID=The Space ID of the Contentful organization we are migrating from.
```

- Posible Configuration:

All code will be done in index.js in root folder. Here you can set up configs.

```
pathFile: Save your input data file in the input folder or change this path accordingly. Example: const pathFile = "./input/" + "your-file-name.tsv";
batchSize: How many entries of the content type are created in sequence.
offset: From which value script should begin. Useful when script has stop and want to restart from certain point.
contentTypeId: The content type ID from Contentful which we want to create or update.
externalContentTypeId: The content type ID from Contentful which we want to migrate data from. (Only use when migrating from contentful to contentful)
```

#### **METHODS**

```javascript
intoContentful.getContentTypeStructure();
```

The hardest part is structuring our new data in the exact way Contentful expects it. The best and fastest way we find to achieve this is first creating an entry of the content type and gettin the API response. We can use this response as a mock up for our data. 
This method saves the API response of the content type in a JSON file called content-type-body.json in the input folder.

```javascript
intoContentful.setDebug();
```

This method breaks script before starting the batch creation of the entries of the content type. Is useful for consoling values of the input data or to test how we are manipulating data.

```javascript
intoContentful.setPublishJustOneBatchForTesting();
```

This method breaks script after first batch creation to test if data creation or update is working as expected. Recomend to use ```batchSize = 1``` to just create one entry.

```javascript
intoContentful.run();

//Options:

// For creating entries from TSV file:
await intoContentful.run("file", "create");

// For Updating entries from existing data:
await intoContentful.run("cma", "update");

// For Migrating from one Contentful Organization to another one:
await intoContentful.run("externalCma", "create");
```

Mandatory method that executes script.


#### **USAGE**

For running the script just:

```
node index
```

#### **HOW IT WORKS**

If you made it up to here you really need to create/update tons of entries, we hope this helps.

Input data is treated as two dimensional array, where each row of the array will contain the data for each entry. 
First row should be use as a guidance using the existing keys of the input data (will always be skipped but **must** be present). Second row should have the content type fields name.

TSV file structrue example:
```
title url topic
title slug category
my-new-title /my-new-title migrations
```
This will create an object with the following structure:

```javascript
row = {title: 'my-new-title', slug: '/my-new-title', category: 'migrations'}
```

To transform our data to the format expected by Contentful we have to do it inside the ```myDataMunging```function.

The ```myDataMunging```function will iterate the input data and will return two arrays. 
- ```row```: Has each row of the TSV file as an object (as explained above). 
- ```parsed```: Carries the transformed data. This means that you must apply all the changes and then pushed into parsed.

Beacuse usually content types have one or many referenes to other content types this script runs batches. For each ```N``` size batch script will iterate the TSV file for the N rows. For linked content types we must provide the unique ID, this process of creating or fetching the IDs must happen inside the ```myDataMunging```function. The parsed data for each batch will be saved in a JSON file and then this file will be used for creating or updating the Content Type.   


#### AVOID ####

Avoid concurrent loops, it may hit contentful API rate-limits.

```javascript

// Bad
 await Promise.all(data.map(async (i) => {
// your code
}));

// Good
for await (const i of data){
// your code
}

```
