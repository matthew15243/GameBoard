newGame = {'password': None, 'max_players': '4', 'game': 'Hearts', 'status': 'Joinable', 'host': 'Matthew', 'configurations': {'Game': {'Name': {'value': "Matthew's Game"}, 'Players': {'value': '8'}}, 'Game_Rules': {'Losing_Score': {'value': '100'}, 'Breaking_Hearts_Rule': {'value': 'True'}, 'Queen_Breaks_Hearts': {'value': 'strange'}, 'Can_Shoot_the_Moon': {'value': 'true'}, 'Jack_of_Diamonds_Bonus': {'value': 'true'}}, 'Timing_Settings': {'Passing_Time_Limit': {'value': '120'}, 'Turn_Time_Limit': {'value': '30'}, 'Pauseable': {'value': 'true'}}}, 'players': [{'Name': 'Matthew', 'Type': 'Human'}], 'player_id_ready_statuses': {'Matthew': False}}
defaults = [{'configurations': {'Game': {'Name': {'default': '', 'description': "This is the name of the game ('s game will be added afterwards)", 'order': 1}, 'Password': {'default': '', 'description': 'Leaving this blank will make the game public.', 'order': 2}, 'Players': {'default': 4, 'description': 'This represents the total number of human players and / or computer players that will be playing', 'max': 6, 'min': 3, 'order': 3}, 'order': 1}, 'Game_Rules': {'Breaking_Hearts_Rule': {'default': True, 'dependentFor': ['Queen_Breaks_Hearts'], 'description': 'If true, ♥ must be played on a trick before ♥ can be lead.', 'options': [True, False], 'order': 2}, 'Can_Shoot_the_Moon': {'default': True, 'description': 'If any player takes all points (Q♠ [13-points] plus all ♥ [1-point each]), then that player will score 0 and all other players will receive 26 points.', 'options': [True, False], 'order': 4}, 'Jack_of_Diamonds_Bonus': {'default': True, 'description': 'Score -10 points for taking the J♦', 'options': [True, False], 'order': 5}, 'Losing_Score': {'default': 100, 'description': 'Once ANY player reaches this score, the game will end.', 'max': 300, 'min': 50, 'order': 1, 'step': 10}, 'Queen_Breaks_Hearts': {'default': True, 'dependentOn': {'Breaking_Hearts_Rule': 'true'}, 'description': 'If true, the Q♠ will count as breaking hearts.', 'options': [True, False], 'order': 3}, 'order': 2}, 'Timing_Settings': {'Passing_Time_Limit': {'addedOptions': [3600, 7200, 18000, 86400, 172800, 432000], 'default': 120, 'max': 600, 'min': 30, 'order': 1, 'step': 30, 'units': 'seconds'}, 'Pauseable': {'default': True, 'options': [True, False], 'order': 3}, 'Turn_Time_Limit': {'addedOptions': [3600, 7200, 18000, 86400, 172800, 432000], 'default': 30, 'max': 300, 'min': 15, 'order': 2, 'step': 15, 'units': 'seconds'}, 'order': 3}}, 'game': 'Hearts'}][0]