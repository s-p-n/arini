module.exports = function term (a, b, c) {
    //console.log("term (context):", this.context);
    switch (a) {
        case 'not':
            return '!' + b;
        case '!':
            return '(function (){' +
                'var i;' +
                'var r = ' + b + ';' +
                ((b[0] === '-') ?
                    'for(i=-1;i>' + b + ';i-=1){':
                    'for(i=1;i<' + b + ';i+=1){'
                ) +
                    'r*=i;' +
                '}' +
                'return r;' +
            '}())';
        case '-':
            return '-' + b;
        case '(':
            return '(' + b + ')';
    }
    switch (b) {
        case '+':
            return a + b + c;
        case '-':
            return a + b + c;
        case '*':
            return a + b + c;
        case '/':
            return a + b + c;
        case 'and':
            return a + '&&' + c;
        case 'or':
            return a + '||' + c;
        case 'is':
            this.ext['$$$compare']();
            return '$$$compare('+a+', '+c+')';
        case 'isnt':
            this.ext['$$$compare']();
            return '!$$$compare('+a+', '+c+')';
        case '&':
            this.ext['$$$concat']();
            this.ext['$$$runtimeError']();
            return '$$$concat(' + a + ',' + c + ',' + this.line + ')';
    }
    return a;
}
