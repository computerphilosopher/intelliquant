def get_parent(d):
    for i in range(len(d)):
        if d[i] == "/":
            last_slash = i
    parent = d[0:last_slash]

    if parent == '':
        parent = "/"
    
    return parent

def mkdir(d, tree):
    parent = get_parent(d)
    tree[parent].add(d)

    if d not in tree:
        tree[d] = set()

def rm(d, tree):
    to_rm = []

    for parent in tree.keys():
        if parent == d or parent in tree[d]:
            to_rm.append(parent)
        ps = frozenset(tree[parent])
        for child in ps:
            if child == d:
                to_rm.append(child)
                tree[parent].remove(child)

    for node in to_rm:
        if node in tree:
            del tree[node]

def cp(source, dest, tree):
    last_slash = 0
    for i in range(len(source)):
        if source[i] == "/":
            last_slash = i

    name = dest + source[last_slash:len(source)]
    tree[dest].add(name)

def tree_to_str(tree):
    ret = set()
    for node in list(tree.keys()):
        if node != "/" and node not in ret:
            ret.add(node)
        for child in tree[node]:
            if child != "/" and child not in ret:
                ret.add(child)

    ret = sorted(list(ret))

    return ["/", ] + ret

def solution(directory, command):
    tree = dict()

    dir = []

    for d in directory:
        dir.append(d.split("/"))

    tree = dict()

    for d in directory:
        if d == "/":
            tree["/"] = set()
            continue
        parent = get_parent(d)
        child = d
        if parent not in tree:
            tree[parent] = set()
        tree[parent].add(child)
        if child not in tree:
            tree[child] = set()
    for line in command:
        cmd = line.split()

        if cmd[0] == 'mkdir':
            mkdir(cmd[1], tree)
        
        elif cmd[0] == 'cp':
            cp(cmd[1], cmd[2], tree)
        
        elif cmd[0] == 'rm':
            rm(cmd[1], tree)
        
        
    return tree_to_str(tree)
    


directory = [
"/",
"/hello",
"/hello/tmp",
"/root",
"/root/abcd",
"/root/abcd/etc",
"/root/abcd/hello"
]

command = [
"mkdir /root/tmp",
"cp /hello /root/tmp", 
"rm /hello"
]

print(solution(directory, command))
