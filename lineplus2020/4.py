def solution(snapshots, transactions):
    state = dict()

    for account, money in snapshots:
        state[account] = int(money)
    
    transactions = sorted(transactions, key=lambda t:(int(t[0])))
    print(transactions)

    already = set()

    for id, action, account, money in transactions:
        if id in already:
            continue
        if account not in state:
            state[account] = 0
        if action == "SAVE":
            state[account] += int(money)
        elif action == "WITHDRAW":
            state[account] -= int(money)

        already.add(id)

    answer = []
    for account, money in state.items():
        answer.append([account, str(money)])
    
    answer = sorted(answer, key = lambda ans:(ans[0]))

    return answer

snapshots = [
  ["ACCOUNT1", "100"], 
  ["ACCOUNT2", "150"]
]

transactions = [
  ["1", "SAVE", "ACCOUNT2", "100"],
  ["2", "WITHDRAW", "ACCOUNT1", "50"], 
  ["1", "SAVE", "ACCOUNT2", "100"], 
  ["4", "SAVE", "ACCOUNT3", "500"], 
  ["3", "WITHDRAW", "ACCOUNT2", "30"]
]

print(solution(snapshots, transactions))