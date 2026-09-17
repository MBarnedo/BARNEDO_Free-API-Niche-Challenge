const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";

async function fetchDefinition(word) {
  if (!word || !word.trim()) {
    return {
      status: 400,
      body: {
        title: "A word is missing",
        message: "Please enter a word.",
      },
    };
  }

  const cleanWord = encodeURIComponent(word.trim().toLowerCase());

  try {
    const response = await fetch(`${API_URL}/${cleanWord}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Lexicon-Scrapbook/1.0",
      },
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error(
        "Dictionary API returned non-JSON response:",
        responseText.slice(0, 200)
      );

      return {
        status: 502,
        body: {
          title: "Dictionary service unavailable",
          message:
            "The dictionary service returned an invalid response. Please try again later.",
        },
      };
    }

    return {
      status: response.status,
      body: data,
    };
  } catch (error) {
    console.error("Dictionary API error:", error);

    return {
      status: 502,
      body: {
        title: "The courier is late",
        message: "The dictionary service could not be reached.",
      },
    };
  }
}

module.exports = {
  fetchDefinition,
};