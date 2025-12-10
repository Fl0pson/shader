cubes1.frag does not work alone, because it gets the uniforms passed
by test_cubes.py!

# 1. Create the virtual environment (folder name: .venv)
python3 -m venv .venv

# 2. Activate the environment
source .venv/bin/activate

# 3. Install the dependencies
pip install -r requirements.txt

# 4. Start the application
python test_cubes.py
