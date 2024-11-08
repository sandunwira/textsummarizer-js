var Summarizer = {};
Summarizer.Utility = {};

// Get text from an HTML document.
Summarizer.Utility.getTextFromHtml = function (someHtmlDoc) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = someHtmlDoc;
    return tmp.textContent || tmp.innerText;
}

// Get sentences from text.
Summarizer.Utility.getSentences = function (text) {
    var sentences = text.split(/\. |\.|\?|!|\n/g);
    sentences = sentences.map(function (sentence) {
        return sentence.trim();
    });
    sentences = sentences.filter(function (sentence) {
        return sentence.length > 0;
    });
    return sentences;
}

// Calculate similarity between 2 sentences.
Summarizer.Utility.calculateSimilarity = function (sentence1, sentence2) {
    var words1 = sentence1.split(" ");
    var words2 = sentence2.split(" ");
    var intersection = words1.filter(function (word) {
        return words2.includes(word);
    });
    var sumOfLengths = Math.log(words1.length) + Math.log(words2.length);
    if (sumOfLengths == 0) {
        return 0;
    } else {
        return intersection.length / sumOfLengths; // JS uses floating point arithmetic by default.
    }
}

// Make directed graph.
Summarizer.Utility.makeGraph = function (sentences) {
    var graph = [];
    var sentenceIdLookup = {};
    for (var i = 0; i < sentences.length; i++) {
        graph[i] = [];
        sentenceIdLookup[i] = sentences[i];
    }
    for (var i = 0; i < sentences.length; i++) {
        for (var j = 0; j < sentences.length; j++) {
            if (i !== j) {
                var similarity = Summarizer.Utility.calculateSimilarity(sentences[i], sentences[j]);
                if (similarity > 0) {
                    graph[i].push({ index: j, weight: similarity });
                }
            }
        }
    }
    graph.sentenceIdLookup = sentenceIdLookup;
    return graph;
}

// Single iteration of Page Rank.
Summarizer.Utility.runPageRankOnce = function (graph, pageRankStruct, totalWeight, totalNumNodes, dampingFactor) {
    var sinkContrib = 0.0;
    for (var idx = 0; idx < totalNumNodes; ++idx) {
        if (graph[idx].length === 0) {
            sinkContrib += pageRankStruct[idx]["oldPR"];
        }
    }
    for (var idx = 0; idx < totalNumNodes; ++idx) {
        var wt = 0.0;
        graph[idx].forEach(function (item) {
            wt += (pageRankStruct[item.index]["oldPR"] / totalWeight[item.index]) * item.weight;
        });
        pageRankStruct[idx]["newPR"] = (1 - dampingFactor) / totalNumNodes + dampingFactor * wt;
    }
    sinkContrib /= totalNumNodes;
    var max_pr_change = 0.0;
    for (var idx = 0; idx < totalNumNodes; ++idx) {
        pageRankStruct[idx]["newPR"] += sinkContrib;
        var change = Math.abs(pageRankStruct[idx]["newPR"] - pageRankStruct[idx]["oldPR"]);
        if (change > max_pr_change) {
            max_pr_change = change;
        }
        pageRankStruct[idx]["oldPR"] = pageRankStruct[idx]["newPR"];
        pageRankStruct[idx]["newPR"] = 0.0;
    }
    return max_pr_change;
}

// Update PageRank
Summarizer.Utility.updatePageRank = function (pageRankStruct, totalNumNodes) {
    var sinkContrib = 0.0;
    var max_pr_change = 0.0;

    for (var idx = 0; idx < totalNumNodes; ++idx) {
        pageRankStruct[idx]["newPR"] += sinkContrib / totalNumNodes;
        var change = Math.abs(pageRankStruct[idx]["newPR"] - pageRankStruct[idx]["oldPR"]);
        if (change > max_pr_change) {
            max_pr_change = change;
        }
        pageRankStruct[idx]["oldPR"] = pageRankStruct[idx]["newPR"];
        pageRankStruct[idx]["newPR"] = 0.0;
    }
    return max_pr_change;
}

// Main PageRank function
Summarizer.Utility.pageRank = function (graph, maxIterations, dampingFactor, delta) {
    var totalNumNodes = graph.length;
    var pageRankStruct = [];
    var totalWeight = [];

    for (var idx = 0; idx < totalNumNodes; ++idx) {
        pageRankStruct[idx] = { "oldPR": 1.0 / totalNumNodes, "newPR": 0.0 };
        totalWeight[idx] = 0.0;
    }

    for (var idx = 0; idx < totalNumNodes; ++idx) {
        var adjacencyList = graph[idx];
        if (adjacencyList == undefined) {
            continue;
        }
        adjacencyList.forEach(function (item) {
            totalWeight[idx] += item["weight"];
        });
    }

    var converged = false;
    for (var iter = 0; iter < maxIterations; ++iter) {
        var maxPRChange = Summarizer.Utility.runPageRankOnce(graph, pageRankStruct, totalWeight, totalNumNodes, dampingFactor);
        if (maxPRChange <= (delta / totalNumNodes)) {
            converged = true;
            break;
        }
    }

    var pageRankResults = {};
    for (var idx = 0; idx < totalNumNodes; ++idx) {
        pageRankResults[idx] = {
            "PR": pageRankStruct[idx]["oldPR"] / totalNumNodes,
            "sentence": graph.sentenceIdLookup[idx]
        };
    }
    return pageRankResults;
}