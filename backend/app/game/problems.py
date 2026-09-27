"""Built-in problem library.

Used three ways: the host's one-click starter pack, the host's library picker,
and solo practice mode. Every problem reads stdin and writes stdout.

`par` is the length of `par_solution`, a reasonably golfed reference answer.
Beat it and you're under par. Tests are (stdin, expected stdout, hidden).
"""

from app.game.scoring import count_chars

_RAW: list[dict] = [
    # ── easy ────────────────────────────────────────────────────────────────
    {
        "slug": "palindrome",
        "title": "Palindrome Checker",
        "difficulty": "easy",
        "description": "Read one line from stdin. Print `True` if it reads the same backwards, otherwise `False`.",
        "original_code": (
            "def is_palindrome(text):\n"
            '    reversed_text = ""\n'
            "    for character in text:\n"
            "        reversed_text = character + reversed_text\n"
            "    return text == reversed_text\n"
            "\n"
            "\n"
            "word = input()\n"
            "print(is_palindrome(word))\n"
        ),
        "par_solution": "s=input();print(s==s[::-1])",
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
        "slug": "fizzbuzz",
        "title": "FizzBuzz",
        "difficulty": "easy",
        "description": (
            "Read an integer `n`. For each number from 1 to n print `Fizz` if divisible by 3, "
            "`Buzz` if divisible by 5, `FizzBuzz` if both, otherwise the number."
        ),
        "original_code": (
            "n = int(input())\n"
            "for number in range(1, n + 1):\n"
            "    if number % 15 == 0:\n"
            '        print("FizzBuzz")\n'
            "    elif number % 3 == 0:\n"
            '        print("Fizz")\n'
            "    elif number % 5 == 0:\n"
            '        print("Buzz")\n'
            "    else:\n"
            "        print(number)\n"
        ),
        "par_solution": 'for i in range(1,int(input())+1):print("Fizz"*(i%3<1)+"Buzz"*(i%5<1)or i)',
        "tests": [
            ("5", "1\n2\nFizz\n4\nBuzz", False),
            ("1", "1", False),
            ("15", "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", True),
            ("3", "1\n2\nFizz", True),
        ],
    },
    {
        "slug": "digit-sum",
        "title": "Digit Sum",
        "difficulty": "easy",
        "description": "Read a non-negative integer. Print the sum of its digits.",
        "original_code": (
            "number = input().strip()\n"
            "total = 0\n"
            "for digit in number:\n"
            "    total = total + int(digit)\n"
            "print(total)\n"
        ),
        "par_solution": "print(sum(map(int,input())))",
        "tests": [
            ("12345", "15", False),
            ("0", "0", False),
            ("999", "27", True),
            ("1000000", "1", True),
            ("86754", "30", True),
        ],
    },
    {
        "slug": "vowel-counter",
        "title": "Vowel Counter",
        "difficulty": "easy",
        "description": "Read one line. Print how many vowels (a, e, i, o, u, either case) it contains.",
        "original_code": (
            "sentence = input()\n"
            'vowels = "aeiouAEIOU"\n'
            "count = 0\n"
            "for letter in sentence:\n"
            "    if letter in vowels:\n"
            "        count += 1\n"
            "print(count)\n"
        ),
        "par_solution": 'print(sum(c in"aeiouAEIOU"for c in input()))',
        "tests": [
            ("Hello World", "3", False),
            ("rhythm", "0", False),
            ("AEIOU aeiou", "10", True),
            ("Every character counts", "7", True),
            ("xyz", "0", True),
        ],
    },
    {
        "slug": "reverse-words",
        "title": "Reverse Words",
        "difficulty": "easy",
        "description": "Read one line of space-separated words. Print the words in reverse order, separated by single spaces.",
        "original_code": (
            "line = input()\n"
            "words = line.split()\n"
            "result = []\n"
            "index = len(words) - 1\n"
            "while index >= 0:\n"
            "    result.append(words[index])\n"
            "    index -= 1\n"
            'print(" ".join(result))\n'
        ),
        "par_solution": "print(*input().split()[::-1])",
        "tests": [
            ("make it shorter", "shorter it make", False),
            ("golf", "golf", False),
            ("every character counts", "counts character every", True),
            ("a b c d e", "e d c b a", True),
        ],
    },
    {
        "slug": "word-count",
        "title": "Word Count",
        "difficulty": "easy",
        "description": "Read one line. Print how many words it contains (words are separated by whitespace).",
        "original_code": (
            "line = input()\n"
            "count = 0\n"
            "in_word = False\n"
            "for character in line:\n"
            '    if character == " ":\n'
            "        in_word = False\n"
            "    elif not in_word:\n"
            "        in_word = True\n"
            "        count += 1\n"
            "print(count)\n"
        ),
        "par_solution": "print(len(input().split()))",
        "tests": [
            ("make it shorter", "3", False),
            ("golf", "1", False),
            ("  lots   of   spaces  ", "3", True),
            ("a b c d e f g", "7", True),
            ("", "0", True),
        ],
    },
    {
        "slug": "list-sum",
        "title": "Sum the List",
        "difficulty": "easy",
        "description": "Read space-separated integers on one line. Print their sum.",
        "original_code": (
            "numbers = input().split()\n"
            "total = 0\n"
            "for number in numbers:\n"
            "    total = total + int(number)\n"
            "print(total)\n"
        ),
        "par_solution": "print(sum(map(int,input().split())))",
        "tests": [
            ("1 2 3", "6", False),
            ("10", "10", False),
            ("-5 5 -5", "-5", True),
            ("100 200 300 400", "1000", True),
            ("0 0 0", "0", True),
        ],
    },
    {
        "slug": "list-max",
        "title": "Biggest Number",
        "difficulty": "easy",
        "description": "Read space-separated integers on one line. Print the largest.",
        "original_code": (
            "numbers = input().split()\n"
            "biggest = int(numbers[0])\n"
            "for number in numbers:\n"
            "    if int(number) > biggest:\n"
            "        biggest = int(number)\n"
            "print(biggest)\n"
        ),
        "par_solution": "print(max(map(int,input().split())))",
        "tests": [
            ("3 9 2", "9", False),
            ("7", "7", False),
            ("-4 -2 -9", "-2", True),
            ("10 100 99", "100", True),
            ("5 5 5", "5", True),
        ],
    },
    {
        "slug": "evens",
        "title": "Even Steven",
        "difficulty": "easy",
        "description": "Read an integer `n`. Print every even number from 0 to n inclusive, separated by spaces.",
        "original_code": (
            "n = int(input())\n"
            "evens = []\n"
            "for number in range(n + 1):\n"
            "    if number % 2 == 0:\n"
            "        evens.append(str(number))\n"
            'print(" ".join(evens))\n'
        ),
        "par_solution": "print(*range(0,int(input())+1,2))",
        "tests": [
            ("6", "0 2 4 6", False),
            ("0", "0", False),
            ("7", "0 2 4 6", True),
            ("1", "0", True),
            ("12", "0 2 4 6 8 10 12", True),
        ],
    },
    {
        "slug": "title-case",
        "title": "Title Case",
        "difficulty": "easy",
        "description": "Read one line of lowercase words. Print it with the first letter of every word capitalised.",
        "original_code": (
            "words = input().split()\n"
            "result = []\n"
            "for word in words:\n"
            "    result.append(word[0].upper() + word[1:])\n"
            'print(" ".join(result))\n'
        ),
        "par_solution": "print(input().title())",
        "tests": [
            ("make it shorter", "Make It Shorter", False),
            ("golf", "Golf", False),
            ("every character counts", "Every Character Counts", True),
            ("a b c", "A B C", True),
        ],
    },
    {
        "slug": "count-char",
        "title": "Character Count",
        "difficulty": "easy",
        "description": "The first line is some text, the second is a single character. Print how many times the character appears in the text.",
        "original_code": (
            "text = input()\n"
            "target = input()\n"
            "count = 0\n"
            "for character in text:\n"
            "    if character == target:\n"
            "        count += 1\n"
            "print(count)\n"
        ),
        "par_solution": "s=input();print(s.count(input()))",
        "tests": [
            ("banana\na", "3", False),
            ("golf\nz", "0", False),
            ("mississippi\ns", "4", True),
            ("aaaa\na", "4", True),
            ("Code Golf\no", "2", True),
        ],
    },
    # ── medium ──────────────────────────────────────────────────────────────
    {
        "slug": "factorial",
        "title": "Factorial",
        "difficulty": "medium",
        "description": "Read a non-negative integer `n`. Print `n!` (the product 1 × 2 × … × n; `0!` is 1).",
        "original_code": (
            "n = int(input())\n"
            "result = 1\n"
            "counter = 1\n"
            "while counter <= n:\n"
            "    result = result * counter\n"
            "    counter = counter + 1\n"
            "print(result)\n"
        ),
        "par_solution": "import math;print(math.factorial(int(input())))",
        "tests": [
            ("5", "120", False),
            ("0", "1", False),
            ("1", "1", True),
            ("10", "3628800", True),
            ("20", "2432902008176640000", True),
        ],
    },
    {
        "slug": "leap-year",
        "title": "Leap Year",
        "difficulty": "medium",
        "description": (
            "Read a year. Print `True` if it's a leap year, otherwise `False`. Leap years are divisible "
            "by 4, except centuries, which must be divisible by 400."
        ),
        "original_code": (
            "year = int(input())\n"
            "if year % 400 == 0:\n"
            "    leap = True\n"
            "elif year % 100 == 0:\n"
            "    leap = False\n"
            "elif year % 4 == 0:\n"
            "    leap = True\n"
            "else:\n"
            "    leap = False\n"
            "print(leap)\n"
        ),
        "par_solution": "y=int(input());print(y%4<1<y%100or y%400<1)",
        "tests": [
            ("2024", "True", False),
            ("2023", "False", False),
            ("1900", "False", False),
            ("2000", "True", True),
            ("2100", "False", True),
            ("1996", "True", True),
            ("2001", "False", True),
        ],
    },
    {
        "slug": "triangle",
        "title": "Star Triangle",
        "difficulty": "medium",
        "description": "Read an integer `n`. Print a right triangle of `*`: row 1 has one star, row n has n stars.",
        "original_code": (
            "height = int(input())\n"
            "for row in range(1, height + 1):\n"
            '    line = ""\n'
            "    for column in range(row):\n"
            '        line = line + "*"\n'
            "    print(line)\n"
        ),
        "par_solution": 'for i in range(int(input())):print("*"*-~i)',
        "tests": [
            ("3", "*\n**\n***", False),
            ("1", "*", False),
            ("5", "*\n**\n***\n****\n*****", True),
            ("2", "*\n**", True),
        ],
    },
    {
        "slug": "fibonacci",
        "title": "Fibonacci",
        "difficulty": "medium",
        "description": "Read an integer `n` (at least 1). Print the first n Fibonacci numbers, starting `0 1 1 2`, separated by spaces.",
        "original_code": (
            "count = int(input())\n"
            "sequence = []\n"
            "first = 0\n"
            "second = 1\n"
            "for index in range(count):\n"
            "    sequence.append(str(first))\n"
            "    next_value = first + second\n"
            "    first = second\n"
            "    second = next_value\n"
            'print(" ".join(sequence))\n'
        ),
        "par_solution": "a,b=0,1\nexec('print(a,end=\" \");a,b=b,a+b;'*int(input()))",
        "tests": [
            ("5", "0 1 1 2 3", False),
            ("1", "0", False),
            ("10", "0 1 1 2 3 5 8 13 21 34", True),
            ("2", "0 1", True),
            ("15", "0 1 1 2 3 5 8 13 21 34 55 89 144 233 377", True),
        ],
    },
    {
        "slug": "prime",
        "title": "Prime Time",
        "difficulty": "medium",
        "description": "Read an integer `n` (at most 10000). Print `True` if it's prime, otherwise `False`.",
        "original_code": (
            "n = int(input())\n"
            "is_prime = n >= 2\n"
            "divisor = 2\n"
            "while divisor * divisor <= n:\n"
            "    if n % divisor == 0:\n"
            "        is_prime = False\n"
            "        break\n"
            "    divisor = divisor + 1\n"
            "print(is_prime)\n"
        ),
        "par_solution": "n=int(input());print(n>1 and all(n%i for i in range(2,n)))",
        "tests": [
            ("7", "True", False),
            ("8", "False", False),
            ("1", "False", False),
            ("2", "True", True),
            ("97", "True", True),
            ("9973", "True", True),
            ("9999", "False", True),
            ("0", "False", True),
        ],
    },
    {
        "slug": "anagram",
        "title": "Anagram Detector",
        "difficulty": "medium",
        "description": "Read two lines. Print `True` if they contain exactly the same characters in any order, otherwise `False`.",
        "original_code": (
            "first = input()\n"
            "second = input()\n"
            "counts = {}\n"
            "for character in first:\n"
            "    counts[character] = counts.get(character, 0) + 1\n"
            "for character in second:\n"
            "    counts[character] = counts.get(character, 0) - 1\n"
            "result = True\n"
            "for value in counts.values():\n"
            "    if value != 0:\n"
            "        result = False\n"
            "print(result)\n"
        ),
        "par_solution": "print(sorted(input())==sorted(input()))",
        "tests": [
            ("listen\nsilent", "True", False),
            ("golf\nflog", "True", False),
            ("code\ncoder", "False", False),
            ("aab\nabb", "False", True),
            ("dusty\nstudy", "True", True),
            ("a\na", "True", True),
        ],
    },
    {
        "slug": "binary",
        "title": "To Binary",
        "difficulty": "medium",
        "description": "Read a non-negative integer. Print it in binary, without any prefix.",
        "original_code": (
            "n = int(input())\n"
            "if n == 0:\n"
            '    print("0")\n'
            "else:\n"
            '    digits = ""\n'
            "    while n > 0:\n"
            "        digits = str(n % 2) + digits\n"
            "        n = n // 2\n"
            "    print(digits)\n"
        ),
        "par_solution": 'print(f"{int(input()):b}")',
        "tests": [
            ("5", "101", False),
            ("0", "0", False),
            ("255", "11111111", True),
            ("1024", "10000000000", True),
            ("6", "110", True),
        ],
    },
    {
        "slug": "times-table",
        "title": "Times Table",
        "difficulty": "medium",
        "description": "Read an integer `n`. Print an n × n multiplication table: row i holds i×1 … i×n separated by spaces.",
        "original_code": (
            "size = int(input())\n"
            "for row in range(1, size + 1):\n"
            "    values = []\n"
            "    for column in range(1, size + 1):\n"
            "        values.append(str(row * column))\n"
            '    print(" ".join(values))\n'
        ),
        "par_solution": "n=int(input())\nfor i in range(n):print(*range(i+1,n*i+n+1,i+1))",
        "tests": [
            ("3", "1 2 3\n2 4 6\n3 6 9", False),
            ("1", "1", False),
            ("4", "1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16", True),
            ("2", "1 2\n2 4", True),
        ],
    },
    # ── hard ────────────────────────────────────────────────────────────────
    {
        "slug": "caesar",
        "title": "Caesar Cipher",
        "difficulty": "hard",
        "description": (
            "The first line is a shift `k`, the second is lowercase text. Shift every letter k places "
            "forward in the alphabet (wrapping z → a). Leave everything else unchanged."
        ),
        "original_code": (
            "shift = int(input())\n"
            "text = input()\n"
            'alphabet = "abcdefghijklmnopqrstuvwxyz"\n'
            'result = ""\n'
            "for character in text:\n"
            "    if character in alphabet:\n"
            "        position = alphabet.index(character)\n"
            "        result = result + alphabet[(position + shift) % 26]\n"
            "    else:\n"
            "        result = result + character\n"
            "print(result)\n"
        ),
        "par_solution": (
            "k=int(input());print(''.join([c,chr((ord(c)-97+k)%26+97)][c.isalpha()]for c in input()))"
        ),
        "tests": [
            ("1\nabc", "bcd", False),
            ("3\nhello, world!", "khoor, zruog!", False),
            ("13\ncode golf", "pbqr tbys", True),
            ("25\nzebra", "ydaqz", True),
            ("26\nsame", "same", True),
        ],
    },
    {
        "slug": "collatz",
        "title": "Collatz Steps",
        "difficulty": "hard",
        "description": (
            "Read a positive integer `n`. Repeatedly halve it if even, or turn it into `3n + 1` if odd. "
            "Print how many steps it takes to reach 1."
        ),
        "original_code": (
            "n = int(input())\n"
            "steps = 0\n"
            "while n != 1:\n"
            "    if n % 2 == 0:\n"
            "        n = n // 2\n"
            "    else:\n"
            "        n = 3 * n + 1\n"
            "    steps = steps + 1\n"
            "print(steps)\n"
        ),
        "par_solution": "n=int(input());c=0\nwhile n>1:n=[n//2,3*n+1][n%2];c+=1\nprint(c)",
        "tests": [
            ("6", "8", False),
            ("1", "0", False),
            ("27", "111", True),
            ("16", "4", True),
            ("97", "118", True),
        ],
    },
    {
        "slug": "run-length",
        "title": "Run-Length Encoding",
        "difficulty": "hard",
        "description": "Read a string of letters. Replace each run of the same letter with the letter and its run length: `aaabcc` → `a3b1c2`.",
        "original_code": (
            "text = input()\n"
            'encoded = ""\n'
            "index = 0\n"
            "while index < len(text):\n"
            "    character = text[index]\n"
            "    run = 0\n"
            "    while index < len(text) and text[index] == character:\n"
            "        run = run + 1\n"
            "        index = index + 1\n"
            "    encoded = encoded + character + str(run)\n"
            "print(encoded)\n"
        ),
        "par_solution": 'import itertools as t;print("".join(k+str(len([*g]))for k,g in t.groupby(input())))',
        "tests": [
            ("aaabcc", "a3b1c2", False),
            ("golf", "g1o1l1f1", False),
            ("zzzzzzzzzz", "z10", True),
            ("aabbaa", "a2b2a2", True),
            ("x", "x1", True),
        ],
    },
    {
        "slug": "brackets",
        "title": "Balanced Brackets",
        "difficulty": "hard",
        "description": "Read a string made of `()[]{}`. Print `True` if every bracket is closed in the right order, otherwise `False`.",
        "original_code": (
            "text = input()\n"
            'pairs = {")": "(", "]": "[", "}": "{"}\n'
            "stack = []\n"
            "balanced = True\n"
            "for character in text:\n"
            '    if character in "([{":\n'
            "        stack.append(character)\n"
            "    elif not stack or stack.pop() != pairs[character]:\n"
            "        balanced = False\n"
            "        break\n"
            "if stack:\n"
            "    balanced = False\n"
            "print(balanced)\n"
        ),
        "par_solution": 's=input()\nfor _ in s:s=s.replace("()","").replace("[]","").replace("{}","")\nprint(not s)',
        "tests": [
            ("([]{})", "True", False),
            ("(]", "False", False),
            ("((()))", "True", False),
            ("({[)]}", "False", True),
            ("{[()()]}", "True", True),
            ("(((", "False", True),
            ("", "True", True),
        ],
    },
    {
        "slug": "roman",
        "title": "Roman Numerals",
        "difficulty": "hard",
        "description": "Read an integer from 1 to 3999. Print it as a Roman numeral (e.g. `1994` → `MCMXCIV`).",
        "original_code": (
            "number = int(input())\n"
            "values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]\n"
            'symbols = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]\n'
            'result = ""\n'
            "for index in range(len(values)):\n"
            "    while number >= values[index]:\n"
            "        result = result + symbols[index]\n"
            "        number = number - values[index]\n"
            "print(result)\n"
        ),
        "par_solution": (
            'n=int(input());r=""\n'
            'for v,s in zip([1000,900,500,400,100,90,50,40,10,9,5,4,1],"M CM D CD C XC L XL X IX V IV I".split()):'
            "r+=s*(n//v);n%=v\n"
            "print(r)"
        ),
        "tests": [
            ("4", "IV", False),
            ("1994", "MCMXCIV", False),
            ("1", "I", True),
            ("3999", "MMMCMXCIX", True),
            ("58", "LVIII", True),
            ("444", "CDXLIV", True),
        ],
    },
    # ── nightmare: confusing specs, nasty edge cases, longer timer ─────────────
    {
        "slug": "look-and-say",
        "title": "Look and Say",
        "difficulty": "nightmare",
        "description": (
            "Read a string of digits. Describe it out loud, run by run: `1211` is one 1, one 2, two 1s, "
            "so print `111221`. Each run becomes its length followed by the digit."
        ),
        "original_code": (
            "digits = input()\n"
            'described = ""\n'
            "position = 0\n"
            "while position < len(digits):\n"
            "    current = digits[position]\n"
            "    run_length = 1\n"
            "    while position + run_length < len(digits) and digits[position + run_length] == current:\n"
            "        run_length = run_length + 1\n"
            "    described = described + str(run_length) + current\n"
            "    position = position + run_length\n"
            "print(described)\n"
        ),
        "par_solution": 'import itertools as t;print("".join(str(len([*g]))+k for k,g in t.groupby(input())))',
        "tests": [
            ("1", "11", False),
            ("1211", "111221", False),
            ("21", "1211", True),
            ("111221", "312211", True),
            ("3322251", "23321511", True),
            ("9", "19", True),
        ],
    },
    {
        "slug": "spiral",
        "title": "Spiral Matrix",
        "difficulty": "nightmare",
        "description": (
            "Read `n`. Fill an n × n grid with 1 … n² walking clockwise from the top-left corner: right, down, "
            "left, up, turning inward whenever you'd leave the grid or hit a filled cell. Print each row, numbers "
            "separated by spaces."
        ),
        "original_code": (
            "size = int(input())\n"
            "grid = []\n"
            "for row_index in range(size):\n"
            "    grid.append([0] * size)\n"
            "directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]\n"
            "row = 0\n"
            "column = 0\n"
            "facing = 0\n"
            "for value in range(1, size * size + 1):\n"
            "    grid[row][column] = value\n"
            "    next_row = row + directions[facing][0]\n"
            "    next_column = column + directions[facing][1]\n"
            "    outside = next_row < 0 or next_row >= size or next_column < 0 or next_column >= size\n"
            "    if outside or grid[next_row][next_column] != 0:\n"
            "        facing = (facing + 1) % 4\n"
            "        next_row = row + directions[facing][0]\n"
            "        next_column = column + directions[facing][1]\n"
            "    row = next_row\n"
            "    column = next_column\n"
            "for line in grid:\n"
            '    print(" ".join(str(number) for number in line))\n'
        ),
        "par_solution": (
            "n=int(input());g={};p=0;d=1\n"
            "for i in range(n*n):\n"
            " g[p]=i+1;q=p+d\n"
            " if not(0<=q.real<n>q.imag>=0)or q in g:d*=1j;q=p+d\n"
            " p=q\n"
            "for y in range(n):print(*[g[x+y*1j]for x in range(n)])"
        ),
        "duration_seconds": 600,
        "tests": [
            ("3", "1 2 3\n8 9 4\n7 6 5", False),
            ("1", "1", False),
            ("2", "1 2\n4 3", True),
            ("4", "1 2 3 4\n12 13 14 5\n11 16 15 6\n10 9 8 7", True),
            ("5", "1 2 3 4 5\n16 17 18 19 6\n15 24 25 20 7\n14 23 22 21 8\n13 12 11 10 9", True),
        ],
    },
    {
        "slug": "rpn",
        "title": "Reverse Polish",
        "difficulty": "nightmare",
        "description": (
            "Evaluate a postfix expression of integers and `+ - *`, tokens separated by spaces: `3 4 + 2 *` is 14. "
            "An operator pops two values (the first popped is the right operand). Careful: `-3` is a number, "
            "`-` alone is subtraction."
        ),
        "original_code": (
            "tokens = input().split()\n"
            "stack = []\n"
            "for token in tokens:\n"
            '    if token == "+" or token == "-" or token == "*":\n'
            "        right = stack.pop()\n"
            "        left = stack.pop()\n"
            '        if token == "+":\n'
            "            stack.append(left + right)\n"
            '        elif token == "-":\n'
            "            stack.append(left - right)\n"
            "        else:\n"
            "            stack.append(left * right)\n"
            "    else:\n"
            "        stack.append(int(token))\n"
            "print(stack[0])\n"
        ),
        "par_solution": (
            "s=[]\n"
            'for t in input().split():s+=[eval(f"{s.pop(-2)}{t}{s.pop()}")if t in"+-*"else int(t)]\n'
            "print(s[0])"
        ),
        "tests": [
            ("3 4 + 2 *", "14", False),
            ("5 1 2 + 4 * + 3 -", "14", False),
            ("10 3 -", "7", True),
            ("-3 4 *", "-12", True),
            ("2 -3 -", "5", True),
            ("7", "7", True),
            ("1 2 3 4 5 * * * *", "120", True),
        ],
    },
    {
        "slug": "josephus",
        "title": "Last One Standing",
        "difficulty": "nightmare",
        "description": (
            "Read `n k`. People 1 … n stand in a circle. Starting from person 1, count k people (counting "
            "yourself as 1) and remove the k-th; resume counting from the next person. Print who is left."
        ),
        "original_code": (
            "count, step = map(int, input().split())\n"
            "circle = list(range(1, count + 1))\n"
            "index = 0\n"
            "while len(circle) > 1:\n"
            "    index = (index + step - 1) % len(circle)\n"
            "    circle.pop(index)\n"
            "print(circle[0])\n"
        ),
        "par_solution": "n,k=map(int,input().split());r=0\nfor i in range(n):r=(r+k)%-~i\nprint(r+1)",
        "tests": [
            ("7 3", "4", False),
            ("5 2", "3", False),
            ("1 5", "1", True),
            ("10 1", "10", True),
            ("6 5", "1", True),
            ("41 3", "31", True),
        ],
    },
    {
        "slug": "largest-number",
        "title": "Biggest Concatenation",
        "difficulty": "nightmare",
        "description": (
            "Read space-separated non-negative integers. Arrange them to form the largest possible number when "
            "glued together, and print it. `3 30 34 5 9` → `9534330`. No leading zeros: `0 0` is just `0`."
        ),
        "original_code": (
            "from functools import cmp_to_key\n"
            "\n"
            "\n"
            "def compare(first, second):\n"
            "    if first + second > second + first:\n"
            "        return -1\n"
            "    if first + second < second + first:\n"
            "        return 1\n"
            "    return 0\n"
            "\n"
            "\n"
            "numbers = input().split()\n"
            "numbers.sort(key=cmp_to_key(compare))\n"
            'result = "".join(numbers)\n'
            'if result[0] == "0":\n'
            '    result = "0"\n'
            "print(result)\n"
        ),
        "par_solution": "print(int(''.join(sorted(input().split(),key=lambda x:x*9)[::-1])))",
        "tests": [
            ("3 30 34 5 9", "9534330", False),
            ("10 2", "210", False),
            ("0 0", "0", True),
            ("121 12", "12121", True),
            ("1", "1", True),
            ("8 89 898", "898988", True),
            ("432 43243", "43243432", True),
        ],
    },
    {
        "slug": "islands",
        "title": "Count the Islands",
        "difficulty": "nightmare",
        "description": (
            "Read a grid of `#` (land) and `.` (water), one row per line, until the input ends. Count the islands: "
            "groups of land connected up, down, left or right. Diagonal neighbours do NOT connect."
        ),
        "original_code": (
            "import sys\n"
            "\n"
            "grid = sys.stdin.read().split()\n"
            "visited = set()\n"
            "islands = 0\n"
            "for start_row in range(len(grid)):\n"
            "    for start_column in range(len(grid[start_row])):\n"
            '        if grid[start_row][start_column] != "#" or (start_row, start_column) in visited:\n'
            "            continue\n"
            "        islands = islands + 1\n"
            "        visited.add((start_row, start_column))\n"
            "        to_explore = [(start_row, start_column)]\n"
            "        while to_explore:\n"
            "            row, column = to_explore.pop()\n"
            "            for next_row, next_column in [(row + 1, column), (row - 1, column), (row, column + 1), (row, column - 1)]:\n"
            "                if 0 <= next_row < len(grid) and 0 <= next_column < len(grid[next_row]):\n"
            '                    if grid[next_row][next_column] == "#" and (next_row, next_column) not in visited:\n'
            "                        visited.add((next_row, next_column))\n"
            "                        to_explore.append((next_row, next_column))\n"
            "print(islands)\n"
        ),
        "par_solution": (
            "g=open(0).read().split();s={(r,c)for r,l in enumerate(g)for c,x in enumerate(l)if'#'==x};n=0\n"
            "while s:\n"
            " n+=1;t=[s.pop()]\n"
            " while t:\n"
            "  r,c=t.pop()\n"
            "  for p in(r+1,c),(r-1,c),(r,c+1),(r,c-1):\n"
            "   if p in s:s-={p};t+=[p]\n"
            "print(n)"
        ),
        "duration_seconds": 600,
        "tests": [
            ("##.\n#..\n..#", "2", False),
            ("...\n...", "0", False),
            ("#.#.#", "3", True),
            ("###\n#.#\n###", "1", True),
            ("#.\n.#", "2", True),
            ("##..#\n#..##\n..#..\n##.##", "5", True),
        ],
    },
    {
        "slug": "rotate-grid",
        "title": "Quarter Turn",
        "difficulty": "nightmare",
        "description": (
            "Read a rectangular grid of characters, one row per line, until the input ends. Rotate it 90° "
            "clockwise and print it. `ab` over `cd` becomes `ca` over `db`."
        ),
        "original_code": (
            "import sys\n"
            "\n"
            "rows = sys.stdin.read().split()\n"
            "height = len(rows)\n"
            "width = len(rows[0])\n"
            "for column in range(width):\n"
            '    new_row = ""\n'
            "    for row in range(height - 1, -1, -1):\n"
            "        new_row = new_row + rows[row][column]\n"
            "    print(new_row)\n"
        ),
        "par_solution": "for r in zip(*open(0).read().split()[::-1]):print(*r,sep='')",
        "tests": [
            ("ab\ncd", "ca\ndb", False),
            ("abc\ndef", "da\neb\nfc", False),
            ("x", "x", True),
            ("golf", "g\no\nl\nf", True),
            ("a\nb\nc", "cba", True),
        ],
    },
    {
        "slug": "number-words",
        "title": "Say the Number",
        "difficulty": "nightmare",
        "description": (
            "Read an integer from 0 to 999 and print it in English, lowercase. Tens and ones are hyphenated "
            "(`forty-two`), hundreds have no \"and\" (`one hundred five`), and round numbers stop early "
            "(`three hundred twenty`, `one hundred`)."
        ),
        "original_code": (
            'ones = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",\n'
            '        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",\n'
            '        "seventeen", "eighteen", "nineteen"]\n'
            'tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]\n'
            "\n"
            "\n"
            "def below_hundred(number):\n"
            "    if number < 20:\n"
            "        return ones[number]\n"
            "    word = tens[number // 10]\n"
            "    if number % 10 != 0:\n"
            '        word = word + "-" + ones[number % 10]\n'
            "    return word\n"
            "\n"
            "\n"
            "number = int(input())\n"
            "hundreds = number // 100\n"
            "rest = number % 100\n"
            "if hundreds == 0:\n"
            "    print(below_hundred(rest))\n"
            "elif rest == 0:\n"
            '    print(ones[hundreds] + " hundred")\n'
            "else:\n"
            '    print(ones[hundreds] + " hundred " + below_hundred(rest))\n'
        ),
        "par_solution": (
            "w='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
            "sixteen seventeen eighteen nineteen'.split()\n"
            "f=lambda n:w[n]if n<20 else'twenty thirty forty fifty sixty seventy eighty ninety'.split()[n//10-2]"
            "+('-'+w[n%10])*(n%10>0)\n"
            "h,r=divmod(int(input()),100)\n"
            "print(h and w[h]+' hundred'+(' '+f(r))*(r>0)or f(r))"
        ),
        "duration_seconds": 600,
        "tests": [
            ("42", "forty-two", False),
            ("0", "zero", False),
            ("100", "one hundred", False),
            ("13", "thirteen", True),
            ("105", "one hundred five", True),
            ("999", "nine hundred ninety-nine", True),
            ("320", "three hundred twenty", True),
            ("811", "eight hundred eleven", True),
        ],
    },
    {
        "slug": "clock-math",
        "title": "Clock Arithmetic",
        "difficulty": "nightmare",
        "description": (
            "The first line is a 24-hour time `HH:MM`, the second a number of minutes to add. It can be negative "
            "or longer than a day. Print the resulting time as `HH:MM` with leading zeros."
        ),
        "original_code": (
            "time_text = input()\n"
            "minutes_to_add = int(input())\n"
            'hours_text, minutes_text = time_text.split(":")\n'
            "total = int(hours_text) * 60 + int(minutes_text) + minutes_to_add\n"
            "total = total % (24 * 60)\n"
            "hours = total // 60\n"
            "minutes = total % 60\n"
            'hours_out = str(hours) if hours >= 10 else "0" + str(hours)\n'
            'minutes_out = str(minutes) if minutes >= 10 else "0" + str(minutes)\n'
            'print(hours_out + ":" + minutes_out)\n'
        ),
        "par_solution": 'h,m=map(int,input().split(":"));t=(h*60+m+int(input()))%1440;print(f"{t//60:02}:{t%60:02}")',
        "tests": [
            ("23:45\n30", "00:15", False),
            ("00:10\n-20", "23:50", False),
            ("12:00\n1440", "12:00", True),
            ("05:07\n-1500", "04:07", True),
            ("09:05\n0", "09:05", True),
            ("18:30\n3000", "20:30", True),
        ],
    },
    {
        "slug": "diamond",
        "title": "Diamond",
        "difficulty": "nightmare",
        "description": (
            "Read `n`. Print a diamond of `*` with 2n − 1 rows: the widest row has 2n − 1 stars. Leading spaces "
            "matter, trailing spaces don't. `n = 2` prints ` *`, `***`, ` *`."
        ),
        "original_code": (
            "size = int(input())\n"
            "rows = []\n"
            "for level in range(1, size + 1):\n"
            '    padding = " " * (size - level)\n'
            '    stars = "*" * (2 * level - 1)\n'
            "    rows.append(padding + stars)\n"
            "for row in rows:\n"
            "    print(row)\n"
            "for row in reversed(rows[:-1]):\n"
            "    print(row)\n"
        ),
        "par_solution": "n=int(input())\nfor i in range(1-n,n):print(' '*abs(i)+'*'*(2*(n-abs(i))-1))",
        "tests": [
            ("2", " *\n***\n *", False),
            ("1", "*", False),
            ("3", "  *\n ***\n*****\n ***\n  *", True),
            ("4", "   *\n  ***\n *****\n*******\n *****\n  ***\n   *", True),
        ],
    },
]


def _build() -> dict[str, dict]:
    library: dict[str, dict] = {}
    for raw in _RAW:
        problem = dict(raw)
        problem["par"] = count_chars(problem["par_solution"])
        problem["original_chars"] = count_chars(problem["original_code"])
        # Harder problems get more time on the clock by default.
        problem.setdefault("duration_seconds", 480 if problem["difficulty"] == "nightmare" else 300)
        library[problem["slug"]] = problem
    return library


LIBRARY: dict[str, dict] = _build()
DIFFICULTIES = ("easy", "medium", "hard", "nightmare")

# One-click packs for new rooms.
STARTER_SLUGS = ["palindrome", "fizzbuzz", "digit-sum", "leap-year", "run-length"]
PACKS: dict[str, list[str]] = {
    "starter": STARTER_SLUGS,
    "nightmare": ["look-and-say", "rpn", "largest-number", "islands", "number-words"],
    "nightmare-full": [slug for slug, p in LIBRARY.items() if p["difficulty"] == "nightmare"],
}
