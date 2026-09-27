"""A starter pack so a host can run a game night in one click."""

SAMPLE_PACK: list[dict] = [
    {
        "title": "Palindrome Checker",
        "description": "Read one line from stdin. Print `True` if it reads the same backwards, otherwise `False`.",
        "original_code": (
            "def is_palindrome(text):\n"
            "    reversed_text = \"\"\n"
            "    for character in text:\n"
            "        reversed_text = character + reversed_text\n"
            "    return text == reversed_text\n"
            "\n"
            "\n"
            "word = input()\n"
            "print(is_palindrome(word))\n"
        ),
        "tests": [
            ("racecar", "True", False),
            ("python", "False", False),
            ("a", "True", False),
            ("abba", "True", True),
            ("abca", "False", True),
            ("neveroddoreven", "True", True),
            ("ab", "False", True),
        ],
    },
    {
        "title": "FizzBuzz",
        "description": (
            "Read an integer `n`. For each number from 1 to n print `Fizz` if divisible by 3, "
            "`Buzz` if divisible by 5, `FizzBuzz` if both, otherwise the number."
        ),
        "original_code": (
            "n = int(input())\n"
            "for number in range(1, n + 1):\n"
            "    if number % 15 == 0:\n"
            "        print(\"FizzBuzz\")\n"
            "    elif number % 3 == 0:\n"
            "        print(\"Fizz\")\n"
            "    elif number % 5 == 0:\n"
            "        print(\"Buzz\")\n"
            "    else:\n"
            "        print(number)\n"
        ),
        "tests": [
            ("5", "1\n2\nFizz\n4\nBuzz", False),
            ("1", "1", False),
            ("15", "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", True),
            ("3", "1\n2\nFizz", True),
        ],
    },
    {
        "title": "Digit Sum",
        "description": "Read a non-negative integer. Print the sum of its digits.",
        "original_code": (
            "number = input().strip()\n"
            "total = 0\n"
            "for digit in number:\n"
            "    total = total + int(digit)\n"
            "print(total)\n"
        ),
        "tests": [
            ("12345", "15", False),
            ("0", "0", False),
            ("999", "27", True),
            ("1000000", "1", True),
            ("86754", "30", True),
        ],
    },
    {
        "title": "Vowel Counter",
        "description": "Read one line. Print how many vowels (a, e, i, o, u, either case) it contains.",
        "original_code": (
            "sentence = input()\n"
            "vowels = \"aeiouAEIOU\"\n"
            "count = 0\n"
            "for letter in sentence:\n"
            "    if letter in vowels:\n"
            "        count += 1\n"
            "print(count)\n"
        ),
        "tests": [
            ("Hello World", "3", False),
            ("rhythm", "0", False),
            ("AEIOU aeiou", "10", True),
            ("Every character counts", "7", True),
            ("xyz", "0", True),
        ],
    },
    {
        "title": "Reverse Words",
        "description": "Read one line of space-separated words. Print the words in reverse order, separated by single spaces.",
        "original_code": (
            "line = input()\n"
            "words = line.split()\n"
            "result = []\n"
            "index = len(words) - 1\n"
            "while index >= 0:\n"
            "    result.append(words[index])\n"
            "    index -= 1\n"
            "print(\" \".join(result))\n"
        ),
        "tests": [
            ("make it shorter", "shorter it make", False),
            ("golf", "golf", False),
            ("every character counts", "counts character every", True),
            ("a b c d e", "e d c b a", True),
        ],
    },
]
