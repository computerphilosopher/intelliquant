def solution(board, moves):
    catched = []
    ret = 0

    dolls = []

    for j in range(len(board[0])):
        dolls.append([])
        for i in range(len(board)-1, -1, -1):
            if board[i][j] != 0:
                dolls[j].append(board[i][j])

    for move in moves:
        m = move - 1
        #if there are no doll in column. nothings happend.
        if dolls[m]:
            target = dolls[m].pop()
            if catched and catched[-1] == target: 
                catched.pop()
                ret += 2
                continue
            catched.append(target)
        
    return ret

b = [[0, 0, 0, 0, 0], [0, 0, 1, 0, 3], [0, 2, 5, 0, 1], [4, 2, 4, 4, 2], [3, 5, 1, 3, 1]]
m = [1, 5, 3, 5, 1, 2, 1, 4]

print(solution(b, m))