# Bulk Modifications Example

This example fetchs all the entries of a Content Type for blogs authors. Reads the new data from a TSV file and uses it to update the existing content.

TSV file has current value and new value for matching which entry should use that value.

#### **USAGE**

```javascript
await intoContentful.run("cma", "update"); // Execute script
```
