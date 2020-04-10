def get_matched(target, user_id):
    ret = []
    
    for id in user_id:
        if len(id) != len(target):
            continue
        matched = True
        for i in range(len(target)):
            if target[i] != '*' and target[i] != id[i]:
                matched = False
                break
        if matched:
            ret.append(id)
    
    return ret

def count_cases(banned_id, matched, i, picked_set, result):
    if i >= len(banned_id):
        result.add(frozenset(picked_set))
        return

    for id in matched[i]:
        if id not in picked_set:
            picked_set.add(id)
            count_cases(banned_id, matched, i + 1, picked_set, result)
            picked_set.remove(id)
    
    
def solution(user_id, banned_id):
    matched = []
    for id in banned_id:
        matched.append(get_matched(id, user_id))
    
    result = set()
    count_cases(banned_id, matched, 0, set(), result)
    return len(result)


print(solution(["frodo", "fradi", "crodo", "abc123", "frodoc"], ["fr*d*", "abc1**"]))
print(solution(["frodo", "fradi", "crodo", "abc123", "frodoc"], ["*rodo", "*rodo", "******"]))
print(solution(["frodo", "fradi", "crodo", "abc123", "frodoc"], ["fr*d*", "*rodo", "******", "******"]))
