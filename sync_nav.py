
import re
import os

base_dir = r"c:\Users\Sc\Desktop\stitch_infinite_holistic_architecture_fit_out (1)\stitch_infinite_holistic_architecture_fit_out\infinite_website"

# 1. Extract standard nav from index.html
with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
    index_content = f.read()

nav_pattern = re.compile(r'(<!-- TopNavBar -->).*?(?=<!-- Hero Section -->|<main)', re.DOTALL)
match = nav_pattern.search(index_content)
if not match:
    print("Could not find nav in index.html")
    exit(1)

standard_nav = match.group(0)
print(f"Extracted standard nav, length: {len(standard_nav)}")

# 2. Files to process
files = [
    "approach.html",
    "journey.html",
    "services.html",
    "projects.html",
    "project-commercial.html",
    "project-dubai.html",
    "project-farm.html",
    "project-jumeirah.html"
]

replace_pattern = re.compile(r'(<!-- TopNavBar -->|<!-- Global Navigation Shell -->).*?(?=<!-- Hero Section -->|<main)', re.DOTALL)

for filename in files:
    filepath = os.path.join(base_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content, count = replace_pattern.subn(standard_nav, content)
    
    if count > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Replaced nav in {filename}")
    else:
        print(f"Failed to replace nav in {filename}")

print("Nav sync complete!")
