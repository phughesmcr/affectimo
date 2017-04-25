# affectimo

Analyse the affect and intensity of a string.

## Usage
```Javascript
const affectimo = require('affectimo');
const text = "A big long string of text...";
let ai = affectimo(text);
console.log(ai)
```

## Output
```Javascript
{
  'AFFECT': 5.34,
  'INTENSITY': 2.83
}
```
Affect range: 1 = very negative, 5 = neutral, 9 = very positive

Intensity range:  1 (neutral/objective post) to 9 (very high)

## Acknowledgements

### References
Sedoc J., Preotiuc-Pietro D. & Ungar, L. (2017). Predicting Emotional Word Ratings using Distributional Representations and Signed Clustering. Proceedings of the 14th Conference of the European Chapter of the Association for Computational Linguistics, EACL.

### Lexicon
Using the affect/intensity lexicon data from http://www.wwbp.org/lexica.html
Used under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported licence

# Licence
(C) 2017 P. Hughes
Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported
[Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)
