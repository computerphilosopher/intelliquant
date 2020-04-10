def is_suspect2(answer_sheet, sheets, idx):
    answer = answer_sheet[idx] 
    duplicate_check = set()

    ret = False

    for r in range(len(sheets)):
        if sheets[r][idx] != answer:
            if sheets[r][idx] in duplicate_check:
                ret = True
                break
            duplicate_check.add(sheets[r][idx])
    
    return ret

def is_suspect(answer, sheet1, sheet2):
    return sheet1 != answer and sheet1 == sheet2


def solution(answer_sheet, sheets):
    
    ret = 0

    for i in range(len(sheets)):
        for j in range(i+1, len(sheets)):
            suspect_cnt = 0
            cur_combo = 0
            max_combo = 0 
            for k in range(len(answer_sheet)):
                if is_suspect(answer_sheet[k], sheets[i][k], sheets[j][k]):
                    suspect_cnt += 1
                    cur_combo += 1
                    max_combo = max(max_combo, cur_combo)
                else:
                    cur_combo = 0
            ret = max(ret, suspect_cnt + (max_combo ** 2))
    
    return ret

#print(is_suspect("4132315142", ["3241523133","4121314445","3243523133","4433325251","2412313253"], 3))
#print(is_suspect("53241", ["53241", "42133", "53241", "14354"], 1))

print(solution("4132315142", ["3241523133","4121314445","3243523133","4433325251","2412313253"]))
print(solution("53241", ["53241", "42133", "53241", "14354"]))
print(solution("24551", ["24553", "24553", "24553", "24553"]))