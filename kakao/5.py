from heapq import heappush
from heapq import heappop

LEFT, RIGHT = 0, 1

def find_left(start, graph, stones):
    here = start-1
    while here != -1 and stones[here] == 0:
        stones[here] -= stones[start]
        here = graph[here][LEFT]
    return here

def find_right(start, graph, stones):
    here = start+1
    while here < len(graph) and stones[here] == 0:
        stones[here] -= stones[start]
        here = graph[here][RIGHT]
    return here

def solution(stones, k):
    min_heap = []
    graph = []

    for i, cnt in enumerate(stones):
        heappush(min_heap, (cnt, i))
        graph.append([i-1, i+1])

    answer = 0
    
    while min_heap:
        finished = False
        while True:
            cnt, here = heappop(min_heap)

            left = find_left(here, graph, stones)
            graph[here][LEFT] = left

            right = find_right(here, graph, stones)
            graph[here][RIGHT] = right
            #print((cnt, here), min_heap[0])
            #print((left, here, right))

            if left != -1:
                graph[left][RIGHT] = right
            if right < len(graph):
                graph[right][LEFT] = left

            stones[here] = 0

            if right - left >= k:
                finished = True
                break
            answer += 1
            if cnt != min_heap[0][0]:
                break
        
        if finished:
            break

    return answer

print(solution([2, 4, 5, 3, 2, 1, 4, 2, 5, 1], 3))