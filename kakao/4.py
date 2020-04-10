from sys import setrecursionlimit
setrecursionlimit(10**7)

def bin_search(empty, left, right, standard):

    if left >= right:
        return float('inf')
    
    mid = (left + right) // 2

    ret = mid if empty[mid] else float('inf')

    if standard < mid:
        ret = min(ret, bin_search(empty, left, mid, standard))

    if not empty[mid]:
        ret = min(ret, bin_search(empty, mid+1, right, standard))
    
    return ret
    

def solution(k, room_number):
    answer = []
    empty = [True for _ in range(k+1)]
    empty[0] = False
    for room in room_number:
        if empty[room]:
            answer.append(room)
            empty[room] = False
            continue
        result = bin_search(empty, room, k, room)
        empty[result] = False
        answer.append(result)
    
    return answer
print(solution(10, [1,3,4,1,3,1]))