/* 
   The mungingHundler function provides each row of data from TSV file
   and a parsed object to pushed wrangled data.

   Below you can define function for munging data for each use case and helper functions
   whicih should be called inside the mungingHundler function.

   row is an object with keys defined on second row of the TSV as explained on readME.
*/

export const myDataMunging = async (row, parsed) => {
  parsed.push({
    title: {
      "en-US": row.title,
    },
  });
};
