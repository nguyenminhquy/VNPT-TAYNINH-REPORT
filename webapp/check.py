import os, time
path = '../templates/TOTRINH'
for f in os.listdir(path):
    p = os.path.join(path, f)
    print(f"{f}: {time.ctime(os.path.getmtime(p))}")
