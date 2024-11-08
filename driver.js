document.addEventListener("DOMContentLoaded", initJS);

function initJS() {
    // Configure this object for tweaking summarization params.
    var configObj = {
        "maxIter": 100,
        "dampingFactor": 0.85,
        "delta": 0.5
    };

    var summarizeButton = document.querySelector("#summarizeButton");
    var inputText = document.querySelector("#input");
    var outputText = document.querySelector("#output");

    summarizeButton.addEventListener("click", function (event) {
        var inputToSummarize = inputText.value.trim();
        if (inputToSummarize.length === 0) {
            outputText.innerHTML = "No text to be summarized...";
        } else {
            // Invoke the summarizer algo.
            var sentences = Summarizer.Utility.getSentences(inputToSummarize);
            console.log(sentences); // Debugging line

            // Convert array of sentences to array of objects with sentence, PR, and idx properties
            sentences = sentences.map(function(sentence, index) {
                return { sentence: sentence, PR: Math.random(), idx: index }; // Assuming PR and idx are generated here
            });

            if (Array.isArray(sentences)) {
                sentences.forEach(function (v) {
                    console.log("sentence: " + v.sentence + ", PR: " + v.PR);
                });

                // Sort in descending order of PR.
                var arr = sentences.sort(function (a, b) {
                    return b.PR - a.PR;
                });

                // Just returning half the original number of lines.
                var halfNumLines = Math.floor(arr.length / 2);
                if (halfNumLines === 0) {
                    halfNumLines = arr.length;
                }

                // Collect the half number of lines and sort them according to their occurrence in the original text.
                arr = arr.splice(0, halfNumLines);
                arr = arr.sort(function (a, b) {
                    return a.idx - b.idx;
                });
                var finalResult = "";
                for (var idx = 0; idx < halfNumLines; ++idx) {
                    if (typeof arr[idx].sentence === 'string') {
                        finalResult += arr[idx].sentence + ". ";
                    }
                }
                outputText.innerHTML = finalResult.trim();
            } else {
                console.error("getSentences did not return an array");
                outputText.innerHTML = "Error: Could not summarize the text.";
            }
        }
    });
}