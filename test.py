values = [str(x) for x in ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king']]
suits = ['diamonds', 'hearts', 'spades', 'clubs']

cards = []
for v in values:
	for s in suits:
		cards.append(f"'{v} of {s}.svg'")

print(', '.join(cards))