from flask import Blueprint, jsonify
import random

hearts_bp = Blueprint('hearts', __name__)
cards = ['ace of diamonds.svg', 'ace of hearts.svg', 'ace of spades.svg', 'ace of clubs.svg', '2 of diamonds.svg', '2 of hearts.svg', '2 of spades.svg', '2 of clubs.svg', '3 of diamonds.svg', '3 of hearts.svg', '3 of spades.svg', '3 of clubs.svg', '4 of diamonds.svg', '4 of hearts.svg', '4 of spades.svg', '4 of clubs.svg', '5 of diamonds.svg', '5 of hearts.svg', '5 of spades.svg', '5 of clubs.svg', '6 of diamonds.svg', '6 of hearts.svg', '6 of spades.svg', '6 of clubs.svg', '7 of diamonds.svg', '7 of hearts.svg', '7 of spades.svg', '7 of clubs.svg', '8 of diamonds.svg', '8 of hearts.svg', '8 of spades.svg', '8 of clubs.svg', '9 of diamonds.svg', '9 of hearts.svg', '9 of spades.svg', '9 of clubs.svg', '10 of diamonds.svg', '10 of hearts.svg', '10 of spades.svg', '10 of clubs.svg', 'jack of diamonds.svg', 'jack of hearts.svg', 'jack of spades.svg', 'jack of clubs.svg', 'queen of diamonds.svg', 'queen of hearts.svg', 'queen of spades.svg', 'queen of clubs.svg', 'king of diamonds.svg', 'king of hearts.svg', 'king of spades.svg', 'king of clubs.svg']

@hearts_bp.route('/deal')
def deal():
    random.shuffle(cards)
    # return jsonify({'cards' : str([cards[i::4] for i in range(4)])})
    return [cards[i::4] for i in range(4)]