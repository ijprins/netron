import sys
import json

def conv(s):
    return s.replace(':', '_')

def main(infile, outfile):
    with open(infile) as f:
        j = json.load(f)
    with open(outfile, 'w') as f:
        f.write('digraph G {\n')
        for node in j['nodes']:
            f.write('  "' + conv(node['name']) + '" [shape=box];\n')
            if node['inputs'] != []:
                for inp in node['inputs']:
                    for inpVal in inp['value']:
                        e1 = '"' + conv(inpVal["name"][:-len('_out0')]) + '"'
                        e2 = '"' + conv(node["name"]) + '"'
                        f.write(f'  {e1} -> {e2};\n')
        f.write('}\n')

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
