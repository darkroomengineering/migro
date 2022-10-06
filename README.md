# Migro
Script for migrating data from one Contentful organization to another via Contentful organization the CMA-API.

If you just have to move data without restructuring it we recommend using the [Contentful CLI](https://github.com/contentful/contentful-cli/) 

#### **SETTING UP**

```
contentTypeId: The content type ID from the Contentful we want to migrate data into.
externalContentTypeId: The content type ID from the Contentful we want to migrate data from.
```

#### **METHOD**

```javascript
await intoContentful.run("externalCma", "create");
```

Mandatory method that executes script.


#### **USAGE**

For running the script just:

```
node index
```

#### **Example**

Very simple example to explain usage. From a contentful organization we have the following Content Type

![from](https://user-images.githubusercontent.com/64488427/194356520-0597b4cc-8e04-4f63-b5e3-eff4a1a34665.png)

and we want to migrate it to other organization a restrcture it in the following way

![into](https://user-images.githubusercontent.com/64488427/194356711-18782591-3087-4c81-8657-590c80fcd98b.png)

Check [index.js](https://github.com/studio-freight/migro/blob/from-contentful-to-contentful/index.js) for code.
