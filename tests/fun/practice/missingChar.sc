/*
	Given a non-empty string and an int n, return a new string where the char at index n has been removed. 
	The value of n will be a valid index of a char in the original string 
	(i.e. n will be in the range 0..str.length()-1 inclusive). 
*/

public missingChar = (str: '', n: 0) {
	return str[:n] & str[n + 1:];
};

print(missingChar("kitten", 1)); // "ktten"
print(missingChar("kitten", 0)); // "itten"
print(missingChar("kitten", 4)); // "kittn"