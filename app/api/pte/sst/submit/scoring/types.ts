export type SSTScoreResult = {

    overallScore: number;

    rubric: {

        content: number;

        form: number;

        grammar: number;

        vocabulary: number;

        spelling: number;

        writtenDiscourse: number;
    };

    /*
    =====================================
    总评
    =====================================
    */

    overallFeedback: string;

    /*
    =====================================
    优点
    =====================================
    */

    strengths: string[];

    /*
    =====================================
    详细弱点
    =====================================
    */

    weaknesses: {

        category: string;

        issue: string;

        example: string;

        suggestion: string;

    }[];

    /*
    =====================================
    语法修改
    =====================================
    */

    grammarCorrections: {

        original: string;

        corrected: string;

        explanation: string;

    }[];

    /*
    =====================================
    完整优化后的参考版本
    =====================================
    */

    improvedAnswer: string;
};