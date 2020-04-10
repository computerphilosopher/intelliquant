def parse_set_to_tuple(set_str, left_brace_index):
    ret = []
    i = left_brace_index + 1

    #"{{2},{2,1},{2,1,3},{2,1,3,4}}"
    while i < len(set_str):
        if set_str[i] == '}':
            break
        if set_str[i] == ',':
            i += 1
            continue

        assert(ord('0') <= ord(set_str[i]) <= ord('10'))
        num_str = ""
        while ord('0') <= ord(set_str[i]) <= ord('9'):
            num_str += set_str[i]
            i += 1
        
        i -= 1
        
        if num_str:
            ret.append(int(num_str))
        i += 1
    
    #return result and next index
    return ret, i



def solution(s):
    answer = []
    
    i = 1
    tuples = []

    while i < len(s):
        if s[i] != '{':
            i += 1
            continue
        t, i = parse_set_to_tuple(s, i)
        tuples.append(t)
    
    tuples.sort(key = lambda t:len(t))
    print(tuples)
    occured = set()
    pick = -1

    for t in tuples:
        origin_len = len(occured)
        for num in t:
            if num in occured:
                continue
            occured.add(num)
            answer.append(num)
            pick = num
        assert(len(occured) == origin_len + 1)
        assert(pick != -1 and t.count(pick) == 1)
    
    return answer

print(solution("{{2},{2,1},{2,1,3},{2,1,3,4}}"))
print(solution("{{1,2,3},{2,1},{1,2,4,3},{2}}"))
print(solution("{{20,111},{111}}"))
print(solution("{{123}}"))
print(solution("{{4,2,3},{3},{2,3,4,1},{2,3}}"))