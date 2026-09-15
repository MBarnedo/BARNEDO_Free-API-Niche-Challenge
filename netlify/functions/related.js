const { fetchRelated } = require("../../lib/dictionary");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const result = await fetchRelated(event.queryStringParameters?.word);
    return { statusCode: result.status, headers, body: JSON.stringify(result.body) };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        title: "Loose pages",
        message: "Related-word notes could not be fetched.",
      }),
    };
  }
};
