def solution(dataSource, tags):
    tag_map = dict()

    for tag in tags:
        tag_map[tag] = []

    for data in dataSource:
        doc = data[0]
        
        for i in range(1, len(data)):
            tag = data[i]
            if tag in tag_map:
                tag_map[tag].append(doc)
        
    #print(tag_map)

    tag_counter = dict()

    for tag, docs in tag_map.items():
        for doc in docs:
            if doc not in tag_counter:
                tag_counter[doc] = 0
            tag_counter[doc] += 1
    
    answer = []
    for doc, count in tag_counter.items():
        answer.append(doc) 
    
    answer = sorted(answer, key = lambda doc:(-tag_counter[doc], doc))

    if len(answer) > 10:
        answer = answer[0:10]

    return answer

dataSource = [
    ["doc1", "t1", "t2", "t3"],
    ["doc2", "t0", "t2", "t3"],
    ["doc3", "t1", "t6", "t7"],
    ["doc4", "t1", "t2", "t4"],
    ["doc5", "t6", "t100", "t8"]
]

tags = ["t1", "t2", "t3"]

print(solution(dataSource, tags))