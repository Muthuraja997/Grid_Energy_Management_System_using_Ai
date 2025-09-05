from setuptools import setup, find_packages

setup(
    name="energy-backend",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "flask",
        "flask-cors",
        "scikit-learn",
        "numpy",
        "pandas"
    ],
)
