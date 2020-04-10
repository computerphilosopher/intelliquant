def solution(inputString):
    left_paren = {"(", "{", "["}
    right_paren = {")", "}", "]"}
    small = []
    mid = []
    big = []
    etc = []
    
    answer = 0
    for i, ch in enumerate(inputString):
        if ch == "(":
            small.append(ch)
        elif ch == ")":
            if not small:
                answer = -1
                break
            small.pop()
            answer += 1
        elif ch == "{":
            mid.append(ch)
        elif ch == "}":
            if not mid:
                answer = -1
                break
            mid.pop()
            answer += 1
        elif ch == "[":
            big.append(ch)
        elif ch == "]":
            if not big:
                answer = -1
                break
            big.pop()
            answer += 1
        elif ch == "<":
            etc.append(ch)
        elif ch == ">":
            if not etc:
                answer = -1
                break
            etc.pop()
            answer += 1

    #print(small, mid, big, etc, answer)
     
    if len(small) or len(mid) or len(big) or len(etc):
        answer = -1
    
    return answer

print(solution(""))
print(solution("Hello, world!"))
print(solution("line [plus]"))
print(solution("if (Count of eggs is 4.) {Buy milk.}"))
print(solution("([Count{ of eggs is] 4.) {Buy (())milk.}"))