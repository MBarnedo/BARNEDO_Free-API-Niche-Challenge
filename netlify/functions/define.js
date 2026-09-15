const { fetchDefinition } = require("../../lib/dictionary");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const result = await fetchDefinition(event.queryStringParameters?.word);
    return { statusCode: result.status, headers, body: JSON.stringify(result.body) };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        title: "The courier is late",
        message: "The dictionary service could not be reached.",
      }),
    };
  }
};
