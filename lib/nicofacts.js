
var nicoFacts = [
	'Nico Fact #0: Nico doesn\'t drink beer, but drunk Nico drinks a little bit of 5 different beers and then spills them.',
	'Nico Fact #1738: He is a bitch among dogs.',
	'Nico Fact #143: He once swung from the tree branches of the Filipino Jungle.',
	'Nico Fact #23: Contrary to popular belief, Nico is not in fact, a \"REAL NIGGA\" as declared by the Reverend Jesse Jackson. He has merely assimilated to his surroundings.',
	'Nico Fact #43. Despite epic gainz, Nico still cannot bench press his own weight.',
	'Nico Fact #1: Nico will bench all the niggas in his way',
	'Nico Fact #1.5: Nico WILL out bench your bitchass',
	'Nico Fact #2: Nico wants men on top of him.',
	'Nico Fact #52: TRUUUUU',
	'Nico Fact #3: Nico is so ornery because of an enlarged medulla oblongata... In his butt.',
	'Nico Fact #58. He is a little bitch.',
	'Nico fact #78: Nico gives himself reach arounds to spice things up.',
	'Nico fact #114: he was the tallest kid in his 2nd grade class',
	'Nico Fact #203: Nico\'s pool game greatly improved after he got tall enough to see over the side of the table.',
	'Nico Fact #203.5: Nico wears 3 inch padded sandals to achieve the necessary height to see over a table.',
	'Nico Fact #32: Nico doesn\'t know what chaser means, so he takes it before his alcohol.',
	'Nico Fact #40: Nico loves Jäger so much because it\'s black.',
	'Nico Fact #993: truuuuu',
	'Nico Fact #1.5: Nico\'s vocabulary consist of a very heavy use of the word \"dick\" due to his fascination of the male anatomy.',
	'Nico Fact #65: He is a real life Benjamin button and is losing basic comprehension.',
	'Nico Fact #999: Nico doesn\'t like Nico Facts.',
	'Nico Fact #61: He does not vape to the best of his potential.',
	'Nico Fact #95: Nico dreams of being able to ride rollercoasters without parental supervision.',
	'Nico Fact #99: Nico\'s got 99 problems and being useless is number one.',
	'Nico Fact #41: Nico always checks the weather report to wear the appropriate sandals.',
	'Nico Fact #37: Nico\'s extensive vape flavors include rare flavors such as dick.',
	'Nico Fact #101: Nico\'s mom will be the one to kill him.',
	'Nico Fact #987: Nico thinks the order of these Nico Facts is how you actually count.',
	'Nico Fact #88: Nico\'s shit stains are bigger than his turds.',
	'Nico Fact #24: Nico is IN FACT the father.',
	'Nico Fact #65: Nico is neither a crip or blood because they do not wear his favorite color, magenta.',
	'Nico Fact #46: Nico\'s polished lap dance skills came from over 2,000 hours of watching Magic Mike on repeat, alone, with his pants off, with a bottle of lotion and tissue box.',
	'Nico Fact #63: If Nico took an IQ test, the results would be negative.',
	'Nico Fact #55: Nico is on his rag 99% of the time.'
]

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

shuffle(nicoFacts);

module.exports = nicoFacts;